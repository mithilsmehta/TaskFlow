// src/pages/ChatPage.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { UserContext } from "../context/userContext";
import { fetchUsers } from "../services/userApi";
import {
    fetchHistory,
    sendMessage,
    markSeen,
    fetchLastMessages,
} from "../services/chatApi"; // removed delete + clear
import { supabase } from "../lib/supabaseClient";

// helpers
const avatarFor = (u) =>
    u?.profileImageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
        u?.name || "User"
    )}&background=random&color=fff`;

const truncate = (s, n = 32) =>
    s?.length > n ? s.slice(0, n - 1) + "…" : s || "";

// --- put these helpers near the top of ChatPage.jsx ---

// Ensure timestamps without TZ are treated as UTC
const ensureTZ = (ts) => {
    if (!ts) return ts;
    const s = String(ts);
    // If it already ends with 'Z' or has ±HH:MM, leave it
    if (/Z$|[+\-]\d{2}:\d{2}$/.test(s)) return s;
    return s + "Z";
};

// Parse with TZ-normalization, then render in your local (or a fixed) timezone
const timeOf = (ts) => {
    if (!ts) return "";
    const d = new Date(ensureTZ(ts));
    // If you want IST specifically, use timeZone: "Asia/Kolkata".
    // If you want the viewer's local timezone, remove the timeZone line.
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    });
};

// Optional: make sure any message object you store is normalized once
const normalizeMsg = (m) => (m ? { ...m, created_at: ensureTZ(m.created_at) } : m);

export default function ChatPage() {
    const { user } = useContext(UserContext);
    const currentUserId = user?._id;

    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [lastByPeer, setLastByPeer] = useState({});
    const [text, setText] = useState("");

    const bottomRef = useRef(null);

    // load users + last messages
    useEffect(() => {
        if (!currentUserId) return;
        (async () => {
            try {
                const [u, last] = await Promise.all([
                    fetchUsers(),
                    fetchLastMessages(currentUserId),
                ]);
                setUsers(Array.isArray(u) ? u : []);
                setLastByPeer(last || {});
            } catch (e) {
                console.error("Init chat load failed:", e.message);
            }
        })();
    }, [currentUserId]);

    // load history
    useEffect(() => {
        if (!selected || !currentUserId) return;
        (async () => {
            try {
                const { messages } = await fetchHistory(currentUserId, selected._id);
                setMessages(messages || []);
                await markSeen(currentUserId, selected._id);

                setLastByPeer((prev) => {
                    const updated = { ...prev };
                    const last = updated?.[selected._id];

                    // force update latest message as seen
                    if (last && last.receiver_id === currentUserId) {
                        updated[selected._id] = { ...last, seen: true };
                    }

                    return updated;
                });
            } catch (e) {
                console.error("History load failed:", e.message);
            }
        })();
    }, [selected, currentUserId]);

    // realtime subscription (INSERT + UPDATE)
    useEffect(() => {
        if (!currentUserId) return;

        const ch = supabase
            .channel("chat-realtime")

            // new messages
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                async ({ new: row }) => {
                    if (messages.some((m) => m.id === row.id)) return;

                    const peerId =
                        row.sender_id === currentUserId ? row.receiver_id : row.sender_id;
                    if (peerId) setLastByPeer((prev) => ({ ...prev, [peerId]: row }));

                    const onThread =
                        selected &&
                        ((row.sender_id === currentUserId &&
                            row.receiver_id === selected._id) ||
                            (row.sender_id === selected._id &&
                                row.receiver_id === currentUserId));
                    if (onThread) {
                        setMessages((prev) => [...prev, row]);
                        if (row.receiver_id === currentUserId) {
                            await markSeen(currentUserId, row.sender_id);

                            // update lastByPeer immediately
                            setLastByPeer((prev) => {
                                const updated = { ...prev };
                                updated[row.sender_id] = { ...row, seen: true };
                                return updated;
                            });
                        }
                    }
                }
            )

            // updates (seen, edits)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "messages" },
                ({ new: row }) => {
                    setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));

                    const peerId = row.sender_id === currentUserId ? row.receiver_id : row.sender_id;
                    setLastByPeer((prev) => ({ ...prev, [peerId]: row }));
                }
            )

            .subscribe();

        return () => supabase.removeChannel(ch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?._id, currentUserId, messages.length]);

    // autoscroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // send
    async function handleSend() {
        if (!text.trim() || !selected || !currentUserId) return;
        const content = text.trim();
        setText("");

        const tempMsg = {
            id: "temp-" + Date.now(),
            sender_id: currentUserId,
            receiver_id: selected._id,
            content,
            created_at: new Date().toISOString(),
            seen: false,
        };
        setMessages((prev) => [...prev, tempMsg]);
        setLastByPeer((prev) => ({ ...prev, [selected._id]: tempMsg }));

        try {
            const saved = await sendMessage({
                senderId: currentUserId,
                receiverId: selected._id,
                content,
            });
            setMessages((prev) =>
                prev.map((m) => (m.id === tempMsg.id ? saved : m))
            );
            setLastByPeer((prev) => ({ ...prev, [selected._id]: saved }));
        } catch (e) {
            alert(e.message || "Failed to send");
        }
    }

    const isUnread = (peerId) => {
        const last = lastByPeer?.[peerId];
        return !!(last && last.receiver_id === currentUserId && !last.seen);
    };

    return (
        <DashboardLayout activeMenu="Chat">
            <div className="bg-white rounded-xl border border-gray-200 flex relative h-[calc(100vh-100px)]">
                {/* LEFT */}
                <aside className="w-full md:w-80 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b bg-white shrink-0">
                        <h3 className="text-lg font-semibold">Chats</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                        {users
                            .filter((u) => u._id !== currentUserId)
                            .map((p) => {
                                const last = lastByPeer?.[p._id];
                                const meLast = last && last.sender_id === currentUserId;
                                return (
                                    <button
                                        key={p._id}
                                        onClick={() => setSelected(p)}
                                        className={`w-full flex gap-3 items-center p-3 rounded-xl mb-2 text-left hover:bg-blue-100/60 transition
                      ${selected?._id === p._id
                                                ? "bg-blue-100/80"
                                                : "bg-white"
                                            }`}
                                    >
                                        <img
                                            src={avatarFor(p)}
                                            alt={p.name}
                                            className="h-10 w-10 rounded-full border object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{p.name}</span>
                                                <span className="text-[11px] text-gray-400 ml-2 shrink-0">
                                                    {timeOf(last?.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {meLast && (
                                                    <span className="flex text-[12px]">
                                                        {last?.seen ? (
                                                            <span className="text-green-600">✔✔</span> // green double tick
                                                        ) : (
                                                            <span className="text-gray-400">✔✔</span> // gray double tick
                                                        )}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500 truncate">
                                                    {truncate(last?.content || "No messages yet")}
                                                </span>
                                                {isUnread(p._id) && (
                                                    <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                    </div>
                </aside>

                {/* RIGHT */}
                <main className="flex-1 flex flex-col h-full">
                    {!selected ? (
                        <div className="h-full grid place-items-center text-gray-400">
                            Select a user to start chatting
                        </div>
                    ) : (
                        <>
                            {/* header */}
                            <div className="border-b p-3 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={avatarFor(selected)}
                                        alt={selected.name}
                                        className="h-9 w-9 rounded-full border object-cover"
                                    />
                                    <div className="leading-tight">
                                        <div className="font-medium">{selected.name}</div>
                                        <div className="text-[11px] text-gray-400">
                                            Direct message
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* messages */}
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                                {messages.map((m) => {
                                    const mine = m.sender_id === currentUserId;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`relative mb-2 flex items-center ${mine ? "justify-end" : "justify-start"
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow ${mine ? "bg-blue-600 text-white" : "bg-white border"
                                                    }`}
                                            >
                                                <div>{m.content}</div>
                                                <div
                                                    className={`text-[10px] mt-1 ${mine ? "text-blue-100" : "text-gray-400"}`}
                                                >
                                                    {timeOf(m.created_at)}{" "}
                                                    {mine && (
                                                        <span className="ml-1 text-[12px]">
                                                            {m.seen ? (
                                                                <span className="text-green-500">✓✓</span>
                                                            ) : (
                                                                <span className="text-gray-400">✓✓</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            {/* input */}
                            <div className="border-t p-3 bg-white shrink-0">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Type a message…"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </DashboardLayout>
    );
}