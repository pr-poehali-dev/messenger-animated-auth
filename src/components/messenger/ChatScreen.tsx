import { useState, useRef, useEffect } from 'react';
import { Chat, Message, User } from '@/types/messenger';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

const REACTIONS = ['❤️', '😂', '🔥', '👍', '😮', '😢'];
const STICKERS = ['😍', '🥳', '🤩', '😎', '🦄', '🚀', '💎', '🎉', '👾', '💫', '🌟', '🎭'];

interface Props {
  chat: Chat;
  currentUser: User;
  otherUser: User;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (text?: string, sticker?: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  formatLastSeen: (user: User) => string;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

interface MsgProps {
  msg: Message;
  isMe: boolean;
  onReact: (emoji: string) => void;
  currentUserId: string;
}

function MessageBubble({ msg, isMe, onReact, currentUserId }: MsgProps) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
      <div className="max-w-[75%] relative">
        <div
          className={`${isMe ? 'msg-bubble-out animate-msg-in-right' : 'msg-bubble-in animate-msg-in-left'} relative cursor-pointer select-none`}
          onDoubleClick={() => setShowReactions(true)}
          onClick={() => showReactions && setShowReactions(false)}
        >
          {msg.sticker ? (
            <span className="text-5xl block py-1">{msg.sticker}</span>
          ) : (
            <span className="text-[15px] leading-relaxed">{msg.text}</span>
          )}
          <span className={`text-[10px] mt-1 block ${isMe ? 'text-white/60 text-right' : 'text-muted-foreground text-right'}`}>
            {formatTime(msg.timestamp)}
            {isMe && <Icon name="CheckCheck" size={12} className="inline ml-1 text-violet-200" />}
          </span>
        </div>

        {/* Реакции */}
        {msg.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {msg.reactions.map(r => (
              <button
                key={r.emoji}
                className={`reaction-chip animate-reaction-pop ${r.userIds.includes(currentUserId) ? 'mine' : ''}`}
                onClick={() => onReact(r.emoji)}
              >
                {r.emoji} <span>{r.userIds.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Панель реакций */}
        {showReactions && (
          <div className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-12 glass-card px-3 py-2 flex gap-2 z-10 animate-scale-in`} style={{ whiteSpace: 'nowrap' }}>
            {REACTIONS.map(e => (
              <button key={e} className="text-xl hover:scale-125 transition-transform active:scale-95" onClick={() => { onReact(e); setShowReactions(false); }}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatScreen({ chat, currentUser, otherUser, messages, onBack, onSendMessage, onAddReaction, formatLastSeen }: Props) {
  const [text, setText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    inputRef.current?.focus();
  };

  const sendSticker = (s: string) => {
    onSendMessage(undefined, s);
    setShowStickers(false);
  };

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      {/* Шапка */}
      <div className="glass px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <Icon name="ChevronLeft" size={24} />
        </button>
        <Avatar user={otherUser} size="sm" showStatus />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{otherUser.name}</p>
          <p className="text-xs text-muted-foreground">{formatLastSeen(otherUser)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="Phone" size={18} />
          </button>
          <button className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="MoreVertical" size={18} />
          </button>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5" onClick={() => setShowStickers(false)}>
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={msg.senderId === currentUser.id}
            onReact={emoji => onAddReaction(msg.id, emoji)}
            currentUserId={currentUser.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Панель стикеров */}
      {showStickers && (
        <div className="glass px-4 py-3 animate-slide-up flex-shrink-0">
          <div className="grid grid-cols-6 gap-2">
            {STICKERS.map(s => (
              <button key={s} className="sticker text-center" onClick={() => sendSticker(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Инпут */}
      <div className="glass px-3 py-3 flex items-center gap-2 flex-shrink-0">
        <button
          className={`p-2 rounded-xl transition-all duration-200 ${showStickers ? 'bg-violet-500/20 text-violet-400' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
          onClick={() => setShowStickers(!showStickers)}
        >
          <Icon name="Smile" size={20} />
        </button>
        <input
          ref={inputRef}
          className="flex-1 bg-secondary rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
          placeholder="Сообщение..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${text.trim() ? 'animate-pulse-glow' : 'text-muted-foreground bg-secondary'}`}
          style={text.trim() ? { background: 'var(--grad-2)' } : {}}
          onClick={send}
        >
          <Icon name="Send" size={18} className={text.trim() ? 'text-white' : ''} />
        </button>
      </div>
    </div>
  );
}
