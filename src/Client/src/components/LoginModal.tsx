import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  KeyRound,
  Mail,
  User,
  Shield,
  GraduationCap,
  AlertCircle,
  X,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, sendVerificationCode, verifyCodeAndLogin } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@edu.xamk.fi') && !trimmedEmail.endsWith('@xamk.fi')) {
      setError(t('login.invalidEmailDomain'));
      return;
    }

    setLoading(true);
    try {
      const res = await sendVerificationCode(trimmedEmail);
      if (res.devCode) {
        setDevCodeHint(res.devCode);
      }
      setStep(2);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isEn ? 'Failed to send verification code.' : 'Vahvistuskoodin lähetys epäonnistui.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError(t('login.emptyCodeError'));
      return;
    }

    setLoading(true);
    try {
      await verifyCodeAndLogin(email.trim().toLowerCase(), code.trim(), displayName.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isEn ? 'Failed to verify code.' : 'Vahvistuskoodin tarkistus epäonnistui.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickName: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(quickEmail, quickName);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isEn ? 'Quick login failed.' : 'Pikakirjautuminen epäonnistui.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#2d323f]">
          <div className="flex items-center gap-2.5">
            <img
              src="/xamk-hero-logo.png"
              alt="Xamk"
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <div className="flex flex-col">
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                {t('login.title')}
              </h2>
              <span className="text-[10px] text-[#fbba18] font-bold tracking-widest uppercase">
                XAMK GAME ROOM
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pikatunnukset */}
        <div className="p-3 rounded-xl bg-[#111318] border border-[#262a36] flex flex-col gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t('login.tryQuick')}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="p-2 rounded-lg bg-[#181a22] hover:bg-[#202433] border border-[#2d323f] hover:border-[#fbba18]/50 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              onClick={() => handleQuickLogin('opiskelija@edu.xamk.fi', 'Matti Meikäläinen')}
              disabled={loading}
            >
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('login.quickStudent')}</span>
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-[#181a22] hover:bg-[#202433] border border-[#2d323f] hover:border-[#fbba18]/50 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              onClick={() => handleQuickLogin('admin@xamk.fi', 'Pääkäyttäjä')}
              disabled={loading}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('login.quickAdmin')}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#fbba18]" />
                <span>{t('login.emailLabel')} *</span>
              </label>
              <input
                type="email"
                placeholder={t('login.emailPlaceholder')}
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
              <span className="text-[10px] text-gray-400">{t('login.allowedHint')}</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-gray-400" />
                <span>{t('login.nameLabel')}</span>
              </label>
              <input
                type="text"
                placeholder={t('login.namePlaceholder')}
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2d323f]">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#1a1d26] border border-[#2d323f] text-gray-300 text-xs font-semibold cursor-pointer"
                onClick={onClose}
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                disabled={loading}
              >
                <span>{loading ? t('common.submitting') : t('login.sendCode')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-3.5">
            <div className="p-3 rounded-xl bg-[#111318] border border-[#262a36] text-xs flex flex-col gap-1">
              <span className="text-gray-400 text-[10px]">{t('login.codeSentAlert')}</span>
              <strong className="text-white">{email}</strong>
              {devCodeHint && (
                <div className="mt-1 pt-1 border-t border-[#262a36] text-[#fbba18] flex items-center justify-between">
                  <span>{t('login.devCodeHint')}</span>
                  <span className="font-mono font-bold">{devCodeHint}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-[#fbba18]" />
                <span>{t('login.enterCodeLabel')} *</span>
              </label>
              <input
                type="text"
                maxLength={6}
                className="w-full h-12 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white text-center font-mono font-bold tracking-widest text-lg rounded-xl px-3 outline-none transition-colors"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#2d323f]">
              <button
                type="button"
                className="px-3 py-2 rounded-xl bg-[#111318] hover:bg-[#1a1d26] border border-[#2d323f] text-gray-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t('common.back')}</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                disabled={loading}
              >
                <span>{loading ? t('common.verifying') : t('login.verifyCode')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
