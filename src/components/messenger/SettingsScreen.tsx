import { useState } from 'react';
import { User } from '@/types/messenger';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface Props {
  currentUser: User;
  onUpdateProfile: (updates: Partial<User>) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

type SettingSection = null | 'name' | 'tag' | 'password' | 'delete' | 'tags';

const ALL_TAGS = ['дизайн', 'музыка', 'спорт', 'путешествия', 'кино', 'книги', 'tech', 'react', 'игры', 'фото'];

export default function SettingsScreen({ currentUser, onUpdateProfile, onLogout, onDeleteAccount }: Props) {
  const [section, setSection] = useState<SettingSection>(null);
  const [name, setName] = useState(currentUser.name);
  const [tag, setTag] = useState(currentUser.tag);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(currentUser.tags);

  const showSaved = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
    setSection(null);
    setError('');
  };

  const saveName = () => {
    if (!name.trim()) { setError('Введите имя'); return; }
    onUpdateProfile({ name: name.trim() });
    showSaved('Имя обновлено');
  };

  const saveTag = () => {
    if (!tag.trim()) { setError('Введите тег'); return; }
    onUpdateProfile({ tag: tag.replace('@', '').trim().toLowerCase() });
    showSaved('Тег обновлён');
  };

  const savePassword = () => {
    if (oldPass !== '12345') { setError('Неверный текущий пароль'); return; }
    if (newPass.length < 4) { setError('Новый пароль не менее 4 символов'); return; }
    if (newPass !== confirmPass) { setError('Пароли не совпадают'); return; }
    showSaved('Пароль изменён');
  };

  const saveTags = () => {
    onUpdateProfile({ tags: selectedTags });
    showSaved('Теги обновлены');
  };

  const toggleTag = (t: string) => {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-6">Настройки</h1>

        {/* Профиль */}
        <div className="glass-card p-5 mb-4 flex items-center gap-4">
          <div className="relative">
            <Avatar user={currentUser} size="lg" showStatus />
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer bg-black/50 rounded-2xl">
              <Icon name="Camera" size={20} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg">{currentUser.name}</p>
            <p className="text-violet-400 text-sm">@{currentUser.tag}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{currentUser.phone}</p>
          </div>
        </div>

        {saved && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm animate-fade-in flex items-center gap-2">
            <Icon name="CheckCircle" size={16} />
            {saved}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Изменить имя */}
        <div className="glass-card overflow-hidden">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors" onClick={() => setSection(section === 'name' ? null : 'name')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Icon name="User" size={16} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Имя</p>
              <p className="text-xs text-muted-foreground">{currentUser.name}</p>
            </div>
            <Icon name={section === 'name' ? 'ChevronUp' : 'ChevronRight'} size={16} className="text-muted-foreground" />
          </button>
          {section === 'name' && (
            <div className="px-4 pb-4 space-y-3 animate-accordion-down">
              <input className="input-field" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button className="gradient-btn w-full py-2.5 text-sm" onClick={saveName}>Сохранить</button>
            </div>
          )}
        </div>

        {/* Изменить тег */}
        <div className="glass-card overflow-hidden">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors" onClick={() => setSection(section === 'tag' ? null : 'tag')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ec4899, #f59e0b)' }}>
              <Icon name="AtSign" size={16} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Тег</p>
              <p className="text-xs text-muted-foreground">@{currentUser.tag}</p>
            </div>
            <Icon name={section === 'tag' ? 'ChevronUp' : 'ChevronRight'} size={16} className="text-muted-foreground" />
          </button>
          {section === 'tag' && (
            <div className="px-4 pb-4 space-y-3 animate-accordion-down">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400">@</span>
                <input className="input-field pl-8" placeholder="тег" value={tag} onChange={e => setTag(e.target.value.replace(/\s/g, '').toLowerCase())} />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button className="gradient-btn w-full py-2.5 text-sm" onClick={saveTag}>Сохранить</button>
            </div>
          )}
        </div>

        {/* Мои теги */}
        <div className="glass-card overflow-hidden">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors" onClick={() => setSection(section === 'tags' ? null : 'tags')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              <Icon name="Tag" size={16} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Мои интересы</p>
              <p className="text-xs text-muted-foreground">{currentUser.tags.length > 0 ? currentUser.tags.map(t => '#' + t).join(', ') : 'Не указаны'}</p>
            </div>
            <Icon name={section === 'tags' ? 'ChevronUp' : 'ChevronRight'} size={16} className="text-muted-foreground" />
          </button>
          {section === 'tags' && (
            <div className="px-4 pb-4 space-y-3 animate-accordion-down">
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${selectedTags.includes(t) ? 'text-white' : 'tag-badge'}`}
                    style={selectedTags.includes(t) ? { background: 'var(--grad-2)' } : {}}
                  >
                    #{t}
                  </button>
                ))}
              </div>
              <button className="gradient-btn w-full py-2.5 text-sm" onClick={saveTags}>Сохранить</button>
            </div>
          )}
        </div>

        {/* Изменить пароль */}
        <div className="glass-card overflow-hidden">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors" onClick={() => setSection(section === 'password' ? null : 'password')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
              <Icon name="Lock" size={16} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Пароль</p>
              <p className="text-xs text-muted-foreground">Изменить пароль</p>
            </div>
            <Icon name={section === 'password' ? 'ChevronUp' : 'ChevronRight'} size={16} className="text-muted-foreground" />
          </button>
          {section === 'password' && (
            <div className="px-4 pb-4 space-y-3 animate-accordion-down">
              <input className="input-field" type="password" placeholder="Текущий пароль" value={oldPass} onChange={e => setOldPass(e.target.value)} />
              <input className="input-field" type="password" placeholder="Новый пароль" value={newPass} onChange={e => setNewPass(e.target.value)} />
              <input className="input-field" type="password" placeholder="Повторите пароль" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button className="gradient-btn w-full py-2.5 text-sm" onClick={savePassword}>Изменить пароль</button>
            </div>
          )}
        </div>

        {/* Выйти */}
        <button
          className="w-full p-4 glass-card flex items-center gap-3 hover:bg-amber-500/10 transition-colors text-amber-400"
          onClick={onLogout}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Icon name="LogOut" size={16} className="text-amber-400" />
          </div>
          <span className="font-medium text-sm">Выйти из аккаунта</span>
        </button>

        {/* Удалить аккаунт */}
        <div className="glass-card overflow-hidden">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-red-400" onClick={() => setSection(section === 'delete' ? null : 'delete')}>
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Icon name="Trash2" size={16} className="text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Удалить аккаунт</p>
              <p className="text-xs text-red-400/60">Это действие необратимо</p>
            </div>
          </button>
          {section === 'delete' && (
            <div className="px-4 pb-4 space-y-3 animate-accordion-down">
              <p className="text-xs text-muted-foreground">Введите <span className="text-red-400 font-mono">УДАЛИТЬ</span> для подтверждения</p>
              <input className="input-field border-red-500/50 focus:border-red-500" placeholder="УДАЛИТЬ" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
              <button
                className="w-full py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-40"
                disabled={deleteConfirm !== 'УДАЛИТЬ'}
                onClick={onDeleteAccount}
              >
                Удалить аккаунт навсегда
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
