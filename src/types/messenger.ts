export interface User {
  id: string;
  name: string;
  phone: string;
  tag: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  tags: string[];
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  sticker?: string;
  timestamp: Date;
  reactions: Reaction[];
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
}

export type Screen = 'auth' | 'chats' | 'chat' | 'search' | 'settings';
export type AuthStep = 'phone' | 'password' | 'register';
