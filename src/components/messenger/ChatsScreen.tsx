import { Chat, User } from '@/types/messenger';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface Props {
  chats: Chat[];
  currentUser: User;
  getOtherUser: (chat: Chat) => User | undefined;
  onOpenChat: (chat: Chat) => void;
  formatLastSeen: (user: User) => string;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return 'сейчас';
  if (mins < 60) return `${mins} мин`;
  if (hours < 24) return `${hours} ч`;
  return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

export default function ChatsScreen({ chats, currentUser, getOtherUser, onOpenChat, formatLastSeen }: Props) {
  const sorted = [...chats].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const ta = a.lastMessage?.timestamp.getTime() ?? 0;
    const tb = b.lastMessage?.timestamp.getTime() ?? 0;
    return tb - ta;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Чаты</h1>
          <button className="w-9 h-9 rounded-xl glass flex items-center justify-center text-violet-400 hover:bg-violet-500/20 transition-colors">
            <Icon name="PenSquare" size={18} />
          </button>
        </div>
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-field pl-9 py-2.5 text-sm" placeholder="Поиск..." readOnly />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {sorted.map((chat, i) => {
          const other = getOtherUser(chat);
          if (!other) return null;
          const lm = chat.lastMessage;
          const isMyMsg = lm?.senderId === currentUser.id;

          return (
            <div
              key={chat.id}
              className="chat-row animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => onOpenChat(chat)}
            >
              <div className="relative">
                <Avatar user={other} size="md" showStatus />
                {chat.isPinned && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                    <Icon name="Pin" size={8} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm truncate">{other.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {lm ? timeAgo(lm.timestamp) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {isMyMsg && <span className="text-violet-400 mr-1">Вы:</span>}
                    {lm?.sticker ? '🎭 Стикер' : lm?.text}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="flex-shrink-0 ml-2 min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white px-1.5"
                      style={{ background: 'var(--grad-2)' }}>
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4 animate-float">💬</div>
            <p className="text-muted-foreground">Пока нет чатов</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Найди людей через поиск</p>
          </div>
        )}
      </div>
    </div>
  );
}
