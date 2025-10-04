const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// =======================
// Helper → always attach token
// =======================
function getAuthHeaders(isJson = true) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// =======================
// Fetch all users in the same company (excluding self)
// =======================
export async function fetchUsers() {
  const res = await fetch(`${API_URL}/api/users`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error((await res.json()).message || 'Failed to fetch users');
  }
  return res.json();
}

// =======================
// Fetch last messages for logged-in user
// =======================
export async function fetchLastMessages() {
  const res = await fetch(`${API_URL}/chat/last-messages`, {
    headers: getAuthHeaders(false), // only token
  });

  if (!res.ok) {
    throw new Error((await res.json()).message || 'Failed to fetch last messages');
  }
  return res.json();
}

// =======================
// Fetch a single user by ID (must be in same company)
// =======================
export async function fetchUserById(id) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    headers: getAuthHeaders(false),
  });

  if (!res.ok) {
    throw new Error((await res.json()).message || 'Failed to fetch user');
  }
  return res.json();
}
