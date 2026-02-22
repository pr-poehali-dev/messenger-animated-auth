import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/messenger';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface Props {
  currentUser: User;
  formatLastSeen: (user: User) => string;
  onStartChat: (user: User) => void;
  onSearchUsers: (q: string, interests: string[]) => Promise<User[]>;
}

const ALL_TAGS = ['дизайн', 'музыка', 'спорт', 'путешествия', 'кино', 'книги', 'tech', 'react', 'игры', 'фото'];

export default function SearchScreen({ currentUser, formatLastSeen, onStartChat, onSearchUsers }: Props) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string, tags: string[]) => {
    setLoading(true);
    try {
      const res = await onSearchUsers(q, tags);
      setResults(res.filter(u => u.id !== currentUser.id));
    } finally {
      setLoading(false);
    }
  }, [onSearchUsers, currentUser.id]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query, selectedTags), 400);
    return () => clearTimeout(timer);
  }, [query, selectedTags, doSearch]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-4">Поиск</h1>
        <div className="relative mb-4">
          <Icon name="Search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-field pl-10" placeholder="Имя, @тег или номер..." value={query} onChange={e => setQuery(e.target.value)} />
          {query && (
            <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setQuery('')}>
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Фильтр по тегам</p>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${selectedTags.includes(tag) ? 'text-white scale-105' : 'tag-badge hover:scale-105'}`}
                style={selectedTags.includes(tag) ? { background: 'var(--grad-2)' } : {}}>
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        )}
        {!loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 animate-float">🔍</div>
            <p className="text-muted-foreground">Никого не нашлось</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Попробуй другие теги или запрос</p>
          </div>
        )}
        {!loading && results.map((user, i) => (
          <div key={user.id} className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.01] transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }} onClick={() => onStartChat(user)}>
            <Avatar user={user} size="md" showStatus />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{user.name}</span>
                <span className="text-xs text-violet-400">@{user.tag}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{formatLastSeen(user)}</p>
              {user.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {user.tags.map(t => (
                    <span key={t} className={`tag-badge ${selectedTags.includes(t) ? 'bg-violet-500/30 border-violet-400/60 text-violet-300' : ''}`}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
            <Icon name="MessageCircle" size={20} className="text-violet-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
