import { useState, useCallback } from 'react';
import { User, Message, Chat, Reaction } from '@/types/messenger';

const DEMO_USERS: User[] = [
  { id: '2', name: 'Алиса Смирнова', phone: '+79161234567', tag: 'alice', avatar: '', status: 'online', tags: ['дизайн', 'музыка'], lastSeen: new Date() },
  { id: '3', name: 'Максим Козлов', phone: '+79261234568', tag: 'maxkozlov', avatar: '', status: 'offline', tags: ['спорт', 'путешествия'], lastSeen: new Date(Date.now() - 3600000) },
  { id: '4', name: 'Кира Волкова', phone: '+79361234569', tag: 'kiravolk', avatar: '', status: 'away', tags: ['кино', 'книги', 'дизайн'], lastSeen: new Date(Date.now() - 1800000) },
  { id: '5', name: 'Денис Орлов', phone: '+79461234570', tag: 'denisorl', avatar: '', status: 'online', tags: ['tech', 'музыка'], lastSeen: new Date() },
];

const DEMO_MESSAGES: Message[] = [
  { id: 'm1', chatId: 'c1', senderId: '2', text: 'Привет! Как дела? 👋', timestamp: new Date(Date.now() - 3600000 * 2), reactions: [{ emoji: '❤️', userIds: ['1'] }], isRead: true },
  { id: 'm2', chatId: 'c1', senderId: '1', text: 'Всё отлично! Работаю над новым проектом 🚀', timestamp: new Date(Date.now() - 3600000), reactions: [], isRead: true },
  { id: 'm3', chatId: 'c1', senderId: '2', text: 'Звучит круто! Расскажи подробнее', timestamp: new Date(Date.now() - 1800000), reactions: [{ emoji: '🔥', userIds: ['1', '2'] }], isRead: true },
  { id: 'm4', chatId: 'c1', senderId: '1', text: 'Строю мессенджер 😄', timestamp: new Date(Date.now() - 900000), reactions: [], isRead: true },
  { id: 'm5', chatId: 'c1', senderId: '2', sticker: '😍', timestamp: new Date(Date.now() - 600000), reactions: [], isRead: false },
  { id: 'm6', chatId: 'c2', senderId: '3', text: 'Привет! Ты как?', timestamp: new Date(Date.now() - 7200000), reactions: [], isRead: true },
  { id: 'm7', chatId: 'c2', senderId: '1', text: 'Отлично, спасибо!', timestamp: new Date(Date.now() - 6000000), reactions: [{ emoji: '😊', userIds: ['3'] }], isRead: true },
  { id: 'm8', chatId: 'c3', senderId: '4', text: 'Посмотри этот фильм обязательно!', timestamp: new Date(Date.now() - 86400000), reactions: [], isRead: false },
  { id: 'm9', chatId: 'c4', senderId: '5', text: 'Слушал новый альбом?', timestamp: new Date(Date.now() - 172800000), reactions: [], isRead: false },
];

const DEMO_CHATS: Chat[] = [
  { id: 'c1', participants: ['1', '2'], unreadCount: 1, isPinned: true, lastMessage: DEMO_MESSAGES[4] },
  { id: 'c2', participants: ['1', '3'], unreadCount: 0, isPinned: false, lastMessage: DEMO_MESSAGES[6] },
  { id: 'c3', participants: ['1', '4'], unreadCount: 1, isPinned: false, lastMessage: DEMO_MESSAGES[7] },
  { id: 'c4', participants: ['1', '5'], unreadCount: 1, isPinned: false, lastMessage: DEMO_MESSAGES[8] },
];

export function useMessengerStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users] = useState<User[]>(DEMO_USERS);
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [chats] = useState<Chat[]>(DEMO_CHATS);

  const login = useCallback((phone: string, password: string): User | null => {
    if (phone === '+79001234567' && password === '12345') {
      const user: User = { id: '1', name: 'Вы', phone, tag: 'me', avatar: '', status: 'online', tags: ['react', 'дизайн'], lastSeen: new Date() };
      setCurrentUser(user);
      return user;
    }
    return null;
  }, []);

  const register = useCallback((name: string, phone: string, password: string, tag: string, avatar?: string): User => {
    const user: User = { id: '1', name, phone, tag, avatar: avatar || '', status: 'online', tags: [], lastSeen: new Date() };
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  const sendMessage = useCallback((chatId: string, text?: string, sticker?: string) => {
    if (!currentUser) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      chatId,
      senderId: currentUser.id,
      text,
      sticker,
      timestamp: new Date(),
      reactions: [],
      isRead: false,
    };
    setMessages(prev => [...prev, msg]);
  }, [currentUser]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentUser) return;
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      const existing = msg.reactions.find(r => r.emoji === emoji);
      if (existing) {
        const hasMe = existing.userIds.includes(currentUser.id);
        return {
          ...msg,
          reactions: hasMe
            ? msg.reactions.map(r => r.emoji === emoji ? { ...r, userIds: r.userIds.filter(id => id !== currentUser.id) } : r).filter(r => r.userIds.length > 0)
            : msg.reactions.map(r => r.emoji === emoji ? { ...r, userIds: [...r.userIds, currentUser.id] } : r)
        };
      }
      return { ...msg, reactions: [...msg.reactions, { emoji, userIds: [currentUser.id] }] };
    }));
  }, [currentUser]);

  const getChatMessages = useCallback((chatId: string) => {
    return messages.filter(m => m.chatId === chatId);
  }, [messages]);

  const getOtherUser = useCallback((chat: Chat): User | undefined => {
    if (!currentUser) return undefined;
    const otherId = chat.participants.find(p => p !== currentUser.id);
    return users.find(u => u.id === otherId);
  }, [currentUser, users]);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setCurrentUser(prev => prev ? { ...prev, ...updates } : prev);
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

  return { currentUser, users, messages, chats, login, register, logout, sendMessage, addReaction, getChatMessages, getOtherUser, updateProfile, formatLastSeen };
}
