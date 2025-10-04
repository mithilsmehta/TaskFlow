import React from "react";

export default function UserList({ users, lastMessages, onSelect }) {
    return (
        <div style={{ width: "250px", borderRight: "1px solid #ddd", padding: 10 }}>
            <h3>Users</h3>
            {users.map((u) => {
                const lastMsg = lastMessages[u._id];
                return (
                    <div
                        key={u._id}
                        style={{
                            padding: "10px",
                            cursor: "pointer",
                            borderRadius: "6px",
                            marginBottom: "6px",
                            background: "#f9f9f9",
                        }}
                        onClick={() => onSelect(u._id)}
                    >
                        <div style={{ fontWeight: "bold" }}>{u.name}</div>
                        <div style={{ fontSize: "12px", color: "#555" }}>
                            {lastMsg ? lastMsg.content : "No messages yet"}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}