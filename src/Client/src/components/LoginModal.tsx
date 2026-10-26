import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  // Vaihe 1: Lähetä varmistuskoodi sähköpostiin
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

  // Vaihe 2: Vahvista koodi ja kirjaudu
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

  // Pikatunnukset suoralla kirjautumisella
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src="/xamk-logo.png"
              alt="Xamk"
              className="modal-xamk-logo"
              style={{ height: '32px', width: 'auto', maxHeight: '32px', objectFit: 'contain' }}
            />
            <DialogTitle className="text-xl font-bold text-white">
              {t('login.title')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[#9da3ae] mt-1">
            {t('login.desc')} {t('login.sessionNotice')}
          </DialogDescription>
        </DialogHeader>

        {/* Pikatunnukset */}
        <div className="quick-login-hints my-2">
          <span className="quick-login-label text-xs text-[#9da3ae]">{t('login.tryQuick')}</span>
          <div className="quick-login-buttons flex gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="quick-btn btn-touch flex-1 hover:border-[#fbba18] hover:text-[#fbba18]"
              onClick={() => handleQuickLogin('opiskelija@edu.xamk.fi', 'Matti Meikäläinen')}
              disabled={loading}
            >
              {t('login.quickStudent')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="quick-btn btn-touch flex-1 hover:border-[#fbba18] hover:text-[#fbba18]"
              onClick={() => handleQuickLogin('admin@xamk.fi', 'Pääkäyttäjä')}
              disabled={loading}
            >
              {t('login.quickAdmin')}
            </Button>
          </div>
        </div>

        {error && <div className="alert alert-error my-2">{error}</div>}

        {step === 1 ? (
          /* VAIHE 1: Sähköpostin syöttö */
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="step-indicator flex items-center gap-2">
              <span className="step-badge active font-bold text-[#fbba18]">1</span>
              <span className="step-title font-semibold">{t('login.step1')}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <span className="text-xs text-[#9da3ae]">{t('login.allowedHint')}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayName">{t('login.nameLabel')}</Label>
              <Input
                id="displayName"
                type="text"
                placeholder={t('login.namePlaceholder')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="btn-touch"
                onClick={onClose}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="xamk"
                className="btn-touch"
                disabled={loading}
              >
                {loading ? t('common.submitting') : t('login.sendCode')}
              </Button>
            </div>
          </form>
        ) : (
          /* VAIHE 2: 6-numeroinen vahvistuskoodi */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="step-indicator flex items-center gap-2">
              <span className="step-badge active font-bold text-[#fbba18]">2</span>
              <span className="step-title font-semibold">{t('login.step2')}</span>
            </div>

            <div className="alert alert-info">
              {t('login.codeSentAlert')} <strong>{email}</strong>!
              {devCodeHint && (
                <div style={{ marginTop: '6px' }}>
                  🔑 <em>{t('login.devCodeHint')}</em> <strong>{devCodeHint}</strong>{' '}
                  ({isEn ? 'or use master test code' : 'tai käytä yleistä koodia'} <code>123456</code>).
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="otp-code">{t('login.enterCodeLabel')}</Label>
              <Input
                id="otp-code"
                type="text"
                className="text-center font-mono tracking-widest text-lg"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="btn-touch"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                {t('common.back')}
              </Button>
              <Button
                type="submit"
                variant="xamk"
                className="btn-touch"
                disabled={loading}
              >
                {loading ? t('common.verifying') : t('login.verifyCode')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
