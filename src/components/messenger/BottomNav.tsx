import Icon from '@/components/ui/icon';

type Tab = 'chats' | 'search' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  unreadTotal: number;
}

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: 'chats', icon: 'MessageCircle', label: 'Чаты' },
  { id: 'search', icon: 'Search', label: 'Поиск' },
  { id: 'settings', icon: 'Settings', label: 'Настройки' },
];

export default function BottomNav({ active, onChange, unreadTotal }: Props) {
  return (
    <nav className="glass flex items-center justify-around px-2 py-2 flex-shrink-0">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab flex-1 relative ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <div className="relative inline-block">
            <Icon name={tab.icon} size={22} />
            {tab.id === 'chats' && unreadTotal > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-0.5 text-white animate-scale-in"
                style={{ background: 'var(--grad-1)' }}>
                {unreadTotal > 9 ? '9+' : unreadTotal}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">{tab.label}</span>
          {active === tab.id && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
          )}
        </button>
      ))}
    </nav>
  );
}
