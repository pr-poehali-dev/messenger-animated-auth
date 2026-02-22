import { useState, useCallback, useEffect } from 'react';
import { User, Message, Chat } from '@/types/messenger';
import { api } from '@/api/client';

interface ApiUser {
  id: number;
  name: string;
  phone: string;
  tag: string;
  avatar_url?: string;
  status: string;
  last_seen: string;
  interests: string[];
}

interface ApiMessage {
  id: number;
  sender_id: number;
  text?: string;
  sticker?: string;
  is_read: boolean;
  created_at: string;
  reactions: { emoji: string; user_ids: number[] }[];
}

interface ApiChat {
  id: number;
  is_pinned: boolean;
  unread_count: number;
  other_user: ApiUser;
  last_message?: ApiMessage;
}

function mapUser(u: ApiUser): User {
  return {
    id: String(u.id),
    name: u.name,
    phone: u.phone,
    tag: u.tag,
    avatar: u.avatar_url || '',
    status: (u.status as 'online' | 'offline' | 'away') || 'offline',
    lastSeen: new Date(u.last_seen),
    tags: u.interests || [],
  };
}

function mapMessage(m: ApiMessage, chatId: string): Message {
  return {
    id: String(m.id),
    chatId,
    senderId: String(m.sender_id),
    text: m.text,
    sticker: m.sticker,
    timestamp: new Date(m.created_at),
    reactions: m.reactions?.map(r => ({ emoji: r.emoji, userIds: r.user_ids.map(String) })) || [],
    isRead: m.is_read,
  };
}

function mapChat(c: ApiChat): Chat {
  const lastMsg = c.last_message ? mapMessage(c.last_message, String(c.id)) : undefined;
  return {
    id: String(c.id),
    participants: [],
    unreadCount: c.unread_count,
    isPinned: c.is_pinned,
    lastMessage: lastMsg,
  };
}

export function useMessengerStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatUserMap, setChatUserMap] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  const loadChats = useCallback(async () => {
    try {
      const res = await api.getChats();
      const mapped = res.chats.map((c: ApiChat) => mapChat(c));
      setChats(mapped);
      const userMap: Record<string, User> = {};
      res.chats.forEach((c: ApiChat) => {
        userMap[String(c.id)] = mapUser(c.other_user);
      });
      setChatUserMap(userMap);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('messenger_token');
    if (!token) { setLoading(false); return; }
    api.getMe().then(res => {
      setCurrentUser(mapUser(res.user));
      loadChats();
    }).catch(() => {
      localStorage.removeItem('messenger_token');
      setLoading(false);
    });
  }, [loadChats]);

  const login = useCallback(async (phone: string, password: string): Promise<User | null> => {
    try {
      const res = await api.login(phone, password);
      localStorage.setItem('messenger_token', res.token);
      const u = mapUser(res.user);
      setCurrentUser(u);
      await loadChats();
      return u;
    } catch {
      return null;
    }
  }, [loadChats]);

  const register = useCallback(async (name: string, phone: string, password: string, tag: string, avatar?: string): Promise<User> => {
    const res = await api.register(name, phone, password, tag, avatar);
    localStorage.setItem('messenger_token', res.token);
    const u = mapUser(res.user);
    setCurrentUser(u);
    setChats([]);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    localStorage.removeItem('messenger_token');
    setCurrentUser(null);
    setChats([]);
    setMessages([]);
    setChatUserMap({});
  }, []);

  const sendMessage = useCallback(async (chatId: string, text?: string, sticker?: string) => {
    if (!currentUser) return;
    const res = await api.sendMessage(Number(chatId), text, sticker);
    const msg = mapMessage(res.message, chatId);
    setMessages(prev => [...prev, msg]);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessage: msg } : c));
  }, [currentUser]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      const res = await api.reactToMessage(Number(messageId), emoji);
      const newReactions = res.reactions.map((r: { emoji: string; user_ids: number[] }) => ({
        emoji: r.emoji,
        userIds: r.user_ids.map(String),
      }));
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m));
    } catch { /* ignore */ }
  }, [currentUser]);

  const loadMessages = useCallback(async (chatId: string) => {
    const res = await api.getMessages(Number(chatId));
    const msgs = res.messages.map((m: ApiMessage) => mapMessage(m, chatId));
    setMessages(prev => {
      const other = prev.filter(m => m.chatId !== chatId);
      return [...other, ...msgs];
    });
    await api.markRead(Number(chatId));
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
  }, []);

  const searchUsers = useCallback(async (q: string, interests: string[]): Promise<User[]> => {
    const res = await api.searchUsers(q, interests);
    const mapped: User[] = res.users.map(mapUser);
    setUsers(mapped);
    return mapped;
  }, []);

  const openChatWith = useCallback(async (user: User): Promise<string> => {
    const res = await api.createChat(Number(user.id));
    const chatId = String(res.chat_id);
    setChats(prev => {
      if (prev.find(c => c.id === chatId)) return prev;
      const newChat: Chat = { id: chatId, participants: [], unreadCount: 0, isPinned: false };
      return [newChat, ...prev];
    });
    setChatUserMap(prev => ({ ...prev, [chatId]: user }));
    return chatId;
  }, []);

  const checkPhone = useCallback(async (phone: string): Promise<boolean> => {
    const res = await api.checkPhone(phone);
    return res.exists;
  }, []);

  const getChatMessages = useCallback((chatId: string) => {
    return messages.filter(m => m.chatId === chatId);
  }, [messages]);

  const getOtherUser = useCallback((chat: Chat): User | undefined => {
    return chatUserMap[chat.id];
  }, [chatUserMap]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    const apiUpdates: Record<string, unknown> = {};
    if (updates.name) apiUpdates.name = updates.name;
    if (updates.tag) apiUpdates.tag = updates.tag;
    if (updates.avatar !== undefined) apiUpdates.avatar_url = updates.avatar;
    if (updates.tags) apiUpdates.interests = updates.tags;
    const res = await api.updateProfile(apiUpdates);
    setCurrentUser(mapUser(res.user));
  }, []);

  const formatLastSeen = useCallback((user: User): string => {
    if (user.status === 'online') return 'онлайн';
    if (!user.lastSeen) return 'давно';
    const diff = Date.now() - user.lastSeen.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `был(а) ${mins} мин. назад`;
    if (hours < 24) return `был(а) ${hours} ч. назад`;
    return `был(а) ${days} дн. назад`;
  }, []);

  return {
    currentUser, users, messages, chats, loading,
    login, register, logout, sendMessage, addReaction,
    getChatMessages, getOtherUser, updateProfile, formatLastSeen,
    loadMessages, searchUsers, openChatWith, checkPhone, loadChats,
  };
}
