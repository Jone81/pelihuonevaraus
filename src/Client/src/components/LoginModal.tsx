import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="xamk-modal-md">
        <DialogHeader>
          <div className="xamk-modal-header-row">
            <div className="xamk-logo-emblem" aria-hidden="true">
              <span className="xamk-logo-emblem-main">XAMK</span>
              <span className="xamk-logo-emblem-sub">GAME ROOM</span>
            </div>
            <div className="xamk-modal-title-group">
              <DialogTitle>{t('login.title')}</DialogTitle>
              <div className="xamk-modal-underline" />
              <DialogDescription>
                {t('login.desc')} {t('login.sessionNotice')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Vaihevalitsin (shadcn/ui Tabs) */}
        <Tabs
          value={String(step)}
          onValueChange={(val) => {
            if (val === '1') setStep(1);
            else if (val === '2' && email.trim()) setStep(2);
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="1">
              {isEn ? '1. University Email' : '1. Koulusähköposti'}
            </TabsTrigger>
            <TabsTrigger value="2" disabled={!email.trim() && step === 1}>
              {isEn ? '2. Verification Code' : '2. Vahvistuskoodi'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {error && <div className="alert alert-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="xamk-modal-form">
            <div className="xamk-field-group">
              <Label htmlFor="email">{t('login.emailLabel')} *</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <span className="xamk-field-hint">{t('login.allowedHint')}</span>
            </div>

            <div className="xamk-field-group">
              <Label htmlFor="displayName">{t('login.nameLabel')}</Label>
              <Input
                id="displayName"
                type="text"
                placeholder={t('login.namePlaceholder')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="pill" disabled={loading}>
                <span>{loading ? t('common.submitting') : t('login.sendCode')}</span>
                <span className="confirm-arrow" aria-hidden="true">
                  →
                </span>
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="xamk-modal-form">
            <div className="alert alert-info">
              {t('login.codeSentAlert')} <strong>{email}</strong>!
              {devCodeHint && (
                <div style={{ marginTop: '6px' }}>
                  🔑 <em>{t('login.devCodeHint')}</em> <strong>{devCodeHint}</strong>{' '}
                  ({isEn ? 'or use master test code' : 'tai käytä yleistä koodia'} <code>123456</code>).
                </div>
              )}
            </div>

            <div className="xamk-field-group">
              <Label htmlFor="otp-code">{t('login.enterCodeLabel')} *</Label>
              <Input
                id="otp-code"
                type="text"
                className="xamk-code-input"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                {t('common.back')}
              </Button>
              <Button type="submit" variant="pill" disabled={loading}>
                <span>{loading ? t('common.verifying') : t('login.verifyCode')}</span>
                <span className="confirm-arrow" aria-hidden="true">
                  →
                </span>
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Pikatunnukset */}
        <div className="xamk-landing-quick-section" style={{ marginTop: '6px' }}>
          <span className="xamk-landing-quick-label">{t('login.tryQuick')}</span>
          <div className="xamk-landing-quick-grid">
            <Button
              type="button"
              variant="station"
              onClick={() => handleQuickLogin('opiskelija@edu.xamk.fi', 'Matti Meikäläinen')}
              disabled={loading}
            >
              <div className="xamk-station-card-left">
                <span className="xamk-station-card-icon" aria-hidden="true">
                  🎓
                </span>
                <span className="xamk-station-card-name">
                  {isEn ? 'Student' : 'Opiskelija'}
                </span>
              </div>
              <Badge variant="status">USER</Badge>
            </Button>
            <Button
              type="button"
              variant="station"
              onClick={() => handleQuickLogin('admin@xamk.fi', 'Pääkäyttäjä')}
              disabled={loading}
            >
              <div className="xamk-station-card-left">
                <span className="xamk-station-card-icon" aria-hidden="true">
                  ⚡
                </span>
                <span className="xamk-station-card-name">SuperAdmin</span>
              </div>
              <Badge variant="status">ADMIN</Badge>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
