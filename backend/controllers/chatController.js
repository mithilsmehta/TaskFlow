const supabase = require('../supabaseClient');
const User = require('../models/User');

// =======================
// Send message
// =======================
const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, type } = req.body || {};

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ message: 'senderId, receiverId, and content are required' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          type: type || 'text',
          seen: false,
        },
      ])
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    console.error('❌ Send message exception:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// =======================
// Get messages between 2 users
// =======================
const getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.query;

    if (!user1 || !user2) {
      return res.status(400).json({ message: 'user1 and user2 required' });
    }

    // ✅ safer way: use .in() instead of .or with raw strings
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .in('sender_id', [user1, user2])
      .in('receiver_id', [user1, user2])
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ messages: data || [] });
  } catch (err) {
    console.error('❌ Get messages exception:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// =======================
// Get last message for each peer
// =======================
const getLastMessages = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: 'userId required' });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq."${userId}",receiver_id.eq."${userId}"`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const latestByPeer = {};
    for (const msg of data) {
      const peerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (peerId && !latestByPeer[peerId]) {
        latestByPeer[peerId] = msg;
      }
    }

    res.json(latestByPeer);
  } catch (err) {
    console.error('❌ Get last messages exception:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// =======================
// Mark messages as seen
// =======================
const markMessagesSeen = async (req, res) => {
  try {
    const { userId, peerId } = req.body || {};

    if (!userId || !peerId) {
      return res.status(400).json({ message: 'userId and peerId are required' });
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ seen: true })
      .eq('receiver_id', userId)
      .eq('sender_id', peerId)
      .eq('seen', false)
      .select();

    if (error) throw error;

    res.json({
      message: 'Messages marked as seen',
      updated: data?.length || 0,
    });
  } catch (err) {
    console.error('❌ Mark seen exception:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getLastMessages,
  markMessagesSeen,
};
