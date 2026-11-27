/**
 * @file LoginModal.tsx
 * @description Kirjautumismodaali-ikkuna, joka tukee kaksivaiheista koulusähköpostin
 * OTP-vahvistuskoodikirjautumista (`@edu.xamk.fi` ja `@xamk.fi`) sekä kehitystilan pikatunnuksia.
 */
import React, { useState } from 'react';
import { User, Zap } from 'lucide-react';
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

/**
 * LoginModal-komponentin ominaisuudet (props).
 */
interface LoginModalProps {
  /** Onko kirjautumismodaali avoinna */
  isOpen: boolean;
  /** Funktio modaalin sulkemiseen */
  onClose: () => void;
}

/**
 * Modaali-ikkuna käyttäjän sisäänkirjautumiseen ja tilin vaihtamiseen.
 */
export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, sendVerificationCode, verifyCodeAndLogin } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  // Kirjautumisvaihe: 1 = sähköpostin syöttö, 2 = 6-numeroisen vahvistuskoodin syöttö
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Vaihe 1: Validoi oppilaitoksen sähköpostipäätteen ja pyytää OTP-vahvistuskoodin lähettämistä.
   */
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
      // Kehitysympäristössä näytetään apukoodi suoraan käyttöliittymässä testausta varten
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

  /**
   * Vaihe 2: Tarkistaa syötetyn 6-numeroisen koodin ja kirjaa käyttäjän sisään.
   */
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

  /**
   * Käsittelee pikakirjautumisen esiasetetuilla testitunnuksilla (Opiskelija / SuperAdmin).
   */
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
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <div className="flex items-start gap-3.5">
            <div
              className="flex flex-col items-center justify-center rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[3px_3px_0px_#000000] px-2.5 py-1.5 shrink-0"
              aria-hidden="true"
            >
              <span className="font-extrabold text-sm leading-none tracking-tight uppercase">
                XAMK
              </span>
              <span className="font-mono font-bold text-[10px] leading-tight tracking-wider uppercase">
                GAME ROOM
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <DialogTitle className="font-extrabold uppercase tracking-tight text-[#F4F4F5]">
                {t('login.title')}
              </DialogTitle>
              <div className="h-1 w-12 bg-[#FACC15]" />
              <DialogDescription className="text-sm text-[#A1A1AA]">
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
              <span className="hidden sm:inline">{isEn ? '1. University email' : '1. Koulusähköposti'}</span>
              <span className="sm:hidden">{isEn ? '1. Email' : '1. Sähköposti'}</span>
            </TabsTrigger>
            <TabsTrigger value="2" disabled={!email.trim() && step === 1}>
              <span className="hidden sm:inline">{isEn ? '2. Verification code' : '2. Vahvistuskoodi'}</span>
              <span className="sm:hidden">{isEn ? '2. Code' : '2. Koodi'}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {error && (
          <div className="rounded-none bg-[#121417] border-2 border-[#EF4444] shadow-[4px_4px_0px_#000000] p-3 text-sm font-mono font-bold text-[#EF4444]">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[#F4F4F5] font-mono font-bold uppercase text-xs tracking-wider"
              >
                {t('login.emailLabel')} *
              </Label>
              <Input
                id="email"
                type="email"
                className="rounded-none bg-white text-[#09090B]"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <span className="block text-xs font-mono text-[#A1A1AA]">
                {t('login.allowedHint')}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="displayName"
                className="text-[#F4F4F5] font-mono font-bold uppercase text-xs tracking-wider"
              >
                {t('login.nameLabel')}
              </Label>
              <Input
                id="displayName"
                type="text"
                className="rounded-none bg-white text-[#09090B]"
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
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="rounded-none bg-[#121417] border-2 border-[#3B82F6] shadow-[4px_4px_0px_#000000] p-3 text-sm text-[#F4F4F5]">
              {t('login.codeSentAlert')} <strong className="font-mono text-[#FACC15] break-all">{email}</strong>.
              {devCodeHint && (
                <div className="mt-1.5">
                  <em>{t('login.devCodeHint')}</em>{' '}
                  <strong className="font-mono text-[#FACC15]">{devCodeHint}</strong> (
                  {isEn ? 'or use test code' : 'tai käytä testikoodia'}{' '}
                  <code className="rounded-none bg-[#1C1F24] border border-[#3F444E] px-1.5 py-0.5 font-mono font-bold text-[#FACC15]">
                    123456
                  </code>
                  ).
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="otp-code"
                className="text-[#F4F4F5] font-mono font-bold uppercase text-xs tracking-wider"
              >
                {t('login.enterCodeLabel')} *
              </Label>
              <Input
                id="otp-code"
                type="text"
                className="rounded-none bg-white text-[#09090B] font-mono font-bold text-center text-xl tracking-[0.4em]"
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
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Pikatunnukset */}
        <div className="mt-2 pt-4 border-t-2 border-[#3F444E] space-y-2.5">
          <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
            {t('login.tryQuick')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              variant="station"
              onClick={() => handleQuickLogin('opiskelija@edu.xamk.fi', 'Matti Meikäläinen')}
              disabled={loading}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-[#121417] border border-[#3F444E] text-[#FACC15]"
                  aria-hidden="true"
                >
                  <User className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="font-mono font-bold text-sm">
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
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-[#121417] border border-[#3F444E] text-[#FACC15]"
                  aria-hidden="true"
                >
                  <Zap className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="font-mono font-bold text-sm">SuperAdmin</span>
              </div>
              <Badge variant="status">ADMIN</Badge>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
