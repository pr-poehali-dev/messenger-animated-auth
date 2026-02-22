import { useState, useRef } from 'react';
import { AuthStep } from '@/types/messenger';
import Icon from '@/components/ui/icon';

interface Props {
  onLogin: (phone: string, password: string) => boolean;
  onRegister: (name: string, phone: string, password: string, tag: string, avatar?: string) => void;
}

const KNOWN_PHONES = ['+79001234567'];

export default function AuthScreen({ onLogin, onRegister }: Props) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const formatPhone = (v: string) => {
    let digits = v.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7') && digits.length > 0) digits = '7' + digits;
    if (digits.length > 11) digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    let result = '+' + digits[0];
    if (digits.length > 1) result += ' (' + digits.slice(1, 4);
    if (digits.length > 4) result += ') ' + digits.slice(4, 7);
    if (digits.length > 7) result += '-' + digits.slice(7, 9);
    if (digits.length > 9) result += '-' + digits.slice(9, 11);
    return result;
  };

  const rawPhone = (v: string) => '+' + v.replace(/\D/g, '');

  const goNext = (nextStep: AuthStep) => {
    setAnimKey(k => k + 1);
    setStep(nextStep);
    setError('');
  };

  const handlePhoneSubmit = () => {
    const rp = rawPhone(phone);
    if (rp.length < 12) { setError('Введите корректный номер'); return; }
    if (KNOWN_PHONES.includes(rp)) goNext('password');
    else goNext('register');
  };

  const handleLogin = () => {
    const ok = onLogin(rawPhone(phone), password);
    if (!ok) setError('Неверный пароль');
  };

  const handleRegister = () => {
    if (!name.trim()) { setError('Введите имя'); return; }
    if (!tag.trim()) { setError('Введите тег'); return; }
    if (regPassword.length < 4) { setError('Пароль не менее 4 символов'); return; }
    onRegister(name, rawPhone(phone), regPassword, tag.replace('@', ''), avatar);
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Фоновые шары */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-20 blur-3xl animate-float" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float" style={{ background: 'radial-gradient(circle, #ec4899, transparent)', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl animate-float" style={{ background: 'radial-gradient(circle, #6366f1, transparent)', animationDelay: '2s' }} />
      </div>

      <div key={animKey} className="glass-card p-8 w-full max-w-sm animate-scale-in relative z-10">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl animate-float" style={{ background: 'var(--grad-1)' }}>
            💬
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 'phone' && 'Добро пожаловать'}
            {step === 'password' && 'Введите пароль'}
            {step === 'register' && 'Создать аккаунт'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'phone' && 'Введите номер телефона'}
            {step === 'password' && phone}
            {step === 'register' && 'Новый пользователь'}
          </p>
        </div>

        {/* Phone step */}
        {step === 'phone' && (
          <div className="space-y-4 animate-fade-in">
            <input className="input-field text-center text-lg tracking-wider" placeholder="+7 (___) ___-__-__" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()} maxLength={18} />
            {error && <p className="text-red-400 text-sm text-center animate-fade-in">{error}</p>}
            <button className="gradient-btn w-full" onClick={handlePhoneSubmit}>Продолжить</button>
            <p className="text-center text-xs text-muted-foreground">Демо: +7 900 123-45-67 / пароль: 12345</p>
          </div>
        )}

        {/* Password step */}
        {step === 'password' && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <input className="input-field pr-12" type={showPass ? 'text' : 'password'} placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPass(!showPass)}>
                <Icon name={showPass ? 'EyeOff' : 'Eye'} size={18} />
              </button>
            </div>
            {error && <p className="text-red-400 text-sm text-center animate-fade-in">{error}</p>}
            <button className="gradient-btn w-full" onClick={handleLogin}>Войти</button>
            <button className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors" onClick={() => goNext('phone')}>← Назад</button>
          </div>
        )}

        {/* Register step */}
        {step === 'register' && (
          <div className="space-y-4 animate-fade-in">
            {/* Аватар */}
            <div className="flex justify-center">
              <button onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-violet-500/50 flex items-center justify-center hover:border-violet-500 transition-colors group relative">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-violet-400 transition-colors">
                    <Icon name="Camera" size={24} />
                    <span className="text-xs">Фото</span>
                  </div>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>
            <input className="input-field" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400 font-medium">@</span>
              <input className="input-field pl-8" placeholder="тег (без пробелов)" value={tag} onChange={e => setTag(e.target.value.replace(/\s/g, '').toLowerCase())} />
            </div>
            <div className="relative">
              <input className="input-field pr-12" type={showPass ? 'text' : 'password'} placeholder="Придумайте пароль" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPass(!showPass)}>
                <Icon name={showPass ? 'EyeOff' : 'Eye'} size={18} />
              </button>
            </div>
            {error && <p className="text-red-400 text-sm text-center animate-fade-in">{error}</p>}
            <button className="gradient-btn w-full" onClick={handleRegister}>Создать аккаунт</button>
            <button className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors" onClick={() => goNext('phone')}>← Назад</button>
          </div>
        )}
      </div>
    </div>
  );
}
