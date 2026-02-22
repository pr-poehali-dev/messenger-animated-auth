import { User } from '@/types/messenger';

interface Props {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #ec4899)',
  'linear-gradient(135deg, #6366f1, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #ec4899, #f59e0b)',
];

const sizes = { sm: 'w-10 h-10 text-base', md: 'w-12 h-12 text-lg', lg: 'w-16 h-16 text-2xl' };
const statusSizes = { sm: 'w-2.5 h-2.5 right-0 bottom-0', md: 'w-3 h-3 right-0.5 bottom-0.5', lg: 'w-4 h-4 right-1 bottom-1' };

export default function Avatar({ user, size = 'md', showStatus = false }: Props) {
  const gradient = GRADIENTS[user.id.charCodeAt(0) % GRADIENTS.length];
  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const statusClass = user.status === 'online' ? 'status-online' : user.status === 'away' ? 'status-away' : 'status-offline';

  return (
    <div className={`relative flex-shrink-0 ${sizes[size]}`}>
      <div className={`${sizes[size]} rounded-2xl flex items-center justify-center font-bold text-white overflow-hidden`} style={{ background: user.avatar ? undefined : gradient }}>
        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} /> : initials}
      </div>
      {showStatus && (
        <span className={`absolute ${statusSizes[size]} rounded-full ${statusClass} ring-2 ring-background`} />
      )}
    </div>
  );
}
