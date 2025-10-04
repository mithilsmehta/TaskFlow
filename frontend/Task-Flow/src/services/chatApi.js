// src/services/chatApi.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// unified auth headers
function getAuthHeaders(isJson = true) {
  const token = localStorage.getItem('token');
  const h = {};
  if (isJson) h['Content-Type'] = 'application/json';
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ---- Send a message (returns saved message row) ----
export async function sendMessage({ senderId, receiverId, content, type = 'text' }) {
  const res = await fetch(`${API_URL}/chat/send`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ senderId, receiverId, content, type }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to send message');
  }
  return data; // { id, sender_id, receiver_id, content, created_at, ... }
}

// ---- History between two users ----
export async function fetchHistory(user1, user2) {
  const res = await fetch(`${API_URL}/chat/history?user1=${user1}&user2=${user2}`, {
    headers: getAuthHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to fetch history');
  }
  return data; // { messages: [...] }
}

// ---- Mark incoming messages from peer -> user as seen ----
export async function markSeen(userId, peerId) {
  const res = await fetch(`${API_URL}/chat/seen`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ userId, peerId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to mark seen');
  }
  return data;
}

// ---- Last message per peer for the logged in user ----
export async function fetchLastMessages(userId) {
  const res = await fetch(`${API_URL}/chat/last-messages?userId=${userId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch last messages');
  return res.json();
}

/// ---- Delete a message only for me ----
// export async function deleteMessageForMe(messageId, userId) {
//   const res = await fetch(`${API_URL}/chat/delete-for-me`, {
//     method: 'DELETE',
//     headers: getAuthHeaders(true),
//     body: JSON.stringify({ messageId, userId }),
//   });
//   const data = await res.json();
//   if (!res.ok) {
//     throw new Error(data?.message || 'Failed to delete message for me');
//   }
//   return data;
// }

// ---- Delete a message for everyone ----
// export async function deleteMessageForEveryone(messageId) {
//   const res = await fetch(`${API_URL}/chat/delete-for-everyone`, {
//     method: 'DELETE',
//     headers: getAuthHeaders(true),
//     body: JSON.stringify({ messageId }),
//   });
//   const data = await res.json();
//   if (!res.ok) {
//     throw new Error(data?.message || 'Failed to delete message for everyone');
//   }
//   return data;
// }

// ---- Clear full chat (for current user only) ----
// export async function clearChat(userId, peerId) {
//   const res = await fetch(`${API_URL}/chat/clear`, {
//     method: 'DELETE',
//     headers: getAuthHeaders(true),
//     body: JSON.stringify({ userId, peerId }),
//   });
//   const data = await res.json();
//   if (!res.ok) {
//     throw new Error(data?.message || 'Failed to clear chat');
//   }
//   return data;
// }
