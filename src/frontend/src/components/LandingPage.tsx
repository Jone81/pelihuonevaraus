/**
 * @file LandingPage.tsx
 * @description Kirjautumattoman käyttäjän julkinen laskeutumissivu (Landing Page).
 * Sisältää ylänavigaation, tervetulobannerin, neljän pikalinkin infopalkin,
 * mahdollisuuden tarkastella reaaliaikaista tilannetta (`RealtimeStatus`),
 * upotetun OTP-kirjautumislomakkeen, pikatunnukset sekä ajankohtaiset uutiset ja pelisäännöt.
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Map,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RealtimeStatus } from './RealtimeStatus';
import { RulesAndGuide } from './RulesAndGuide';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscordIcon } from '@/components/ui/discord-icon';
import type { NewsItem } from '../types';

/**
 * LandingPage-komponentin ominaisuudet (props).
 */
interface LandingPageProps {
  /** Valinnainen funktio kirjautumismodaalin avaamiseen */
  onOpenLogin?: () => void;
  /** Valinnainen funktio vikailmoitusmodaalin avaamiseen */
  onOpenIssueModal?: () => void;
  /** Valinnainen funktio pohjakuvamodaalin avaamiseen */
  onOpenFloorPlan?: () => void;
}

/**
 * Xamkin visuaalinen X-tunnusmerkki (SVG) laskeutumissivun Hero-laatikossa.
 */
const XamkXEmblem: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    width="54"
    height="54"
    aria-hidden="true"
    className="shrink-0"
  >
    <path
      d="M6 6 H25 L32 13 L39 6 H58 V25 L51 32 L58 39 V58 H39 L32 51 L25 58 H6 V39 L13 32 L6 25 Z"
      fill="none"
      stroke="#FACC15"
      strokeWidth="3.2"
      strokeLinejoin="miter"
    />
  </svg>
);

/**
 * Julkinen laskeutumissivu ennen sisäänkirjautumista.
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenIssueModal,
  onOpenFloorPlan,
}) => {
  const { login, verifyCodeAndLogin, sendVerificationCode } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  // Upotetun kirjautumislomakkeen ja esikatselun tilat
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showRealtimeStatus, setShowRealtimeStatus] = useState(false);
  const [showRulesGuide, setShowRulesGuide] = useState(false);

  // Haetaan uutiset ja tiedotteet julkista näkymää varten
  const { data: newsItems, isLoading: isNewsLoading } = useQuery<NewsItem[]>({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
  });

  // Poimitaan kiinnitetty tai uusin tiedote Hero-laatikon alaotsikoksi
  const pinnedOrLatestNews = useMemo(() => {
    if (!newsItems || newsItems.length === 0) return null;
    return newsItems.find((n) => n.isPinned) || newsItems[0];
  }, [newsItems]);

  /**
   * Vierittää sivun pehmeästi kirjautumisen sähköpostikenttään ja asettaa siihen fokuksen.
   */
  const focusLoginInput = () => {
    const el = document.getElementById('landing-email');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    } else if (onOpenLogin) {
      onOpenLogin();
    }
  };

  /**
   * Vierittää sivun annetun HTML-tunnisteen (`id`) mukaiseen osioon.
   */
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * Vaihe 1: Lähettää OTP-vahvistuskoodin syötettyyn oppilaitoksen sähköpostiosoitteeseen.
   */
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage(
        isEn ? 'Enter your university email address.' : 'Anna koulun sähköpostiosoite.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await sendVerificationCode(email.trim());
      setStep(2);
      setStatusMessage(res.message);
      if (res.devCode) {
        setDevCodeHint(res.devCode);
        setCode(res.devCode);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          isEn
            ? 'Failed to send verification code. Check your email address.'
            : 'Koodin lähetys epäonnistui. Tarkista sähköpostiosoite.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Vaihe 2: Vahvistaa 6-numeroisen OTP-koodin ja kirjaa käyttäjän sisään.
   */
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage(t('login.emptyCodeError'));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await verifyCodeAndLogin(
        email.trim(),
        code.trim(),
        displayName.trim() || undefined
      );
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          isEn ? 'Login failed. Check the verification code.' : 'Kirjautuminen epäonnistui. Tarkista koodi.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Suorittaa pikakirjautumisen kehitystilan pikatunnuksilla (Opiskelija / SuperAdmin).
   */
  const handleInstantLogin = async (testEmail: string, testName: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login(testEmail, testName);
    } catch {
      // Jos suora kirjautuminen ei onnistu, esitäytetään OTP-vaihe oletuskoodilla
      setEmail(testEmail);
      setDisplayName(testName);
      setCode('123456');
      setDevCodeHint('123456');
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121417] text-[#F4F4F5] font-sans">
      {/* 1. Single-Row Top Navigation Bar (Only Brand, LanguageSwitcher, and Login Button when not logged in) */}
      {/* 1. Ylätunniste: Brändilogo, kielivalitsin ja kirjautumispainike */}
      <header className="sticky top-0 z-50 bg-[#121417] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-3 min-w-0 flex-shrink bg-transparent border-0 p-0 text-left cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="/xamk_logo_tiivis_kehys_keltainen_rgb.png"
              alt="Xamk"
              className="h-6 sm:h-7 md:h-8 w-auto object-contain flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold uppercase tracking-tight text-[#F4F4F5] text-[11px] sm:text-xs md:text-sm truncate">
                {isEn ? 'GAME ROOM BOOKING' : 'PELIHUONEVARAUS'}
              </span>
              <span className="font-mono text-[#FACC15] font-bold tracking-widest uppercase text-[8px] sm:text-[9px] md:text-[10px] truncate">
                XAMK GAME ROOM
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <LanguageSwitcher className="mobile-lang-switcher" />

            <Button
              type="button"
              variant="pill"
              size="sm"
              onClick={() => (onOpenLogin ? onOpenLogin() : focusLoginInput())}
            >
              <span className="hidden sm:inline">{t('nav.login')}</span>
              <span className="sm:hidden">{isEn ? 'Log in' : 'Kirjaudu'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Banner */}
      {/* 2. Tervetulobanneri ja aukioloaikojen infolaatikko */}
      <section className="bg-[#121417] border-b-[3px] border-black py-10 sm:py-14 px-4 sm:px-6 lg:px-8" aria-label={t('landing.welcome')}>
        <div className="w-full">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex flex-col items-start">
              <h1 className="bg-[#FACC15] text-[#09090B] border-[3px] border-black shadow-[6px_6px_0px_#000000] -rotate-1 inline-flex flex-col px-6 py-3 font-extrabold uppercase tracking-tight text-3xl sm:text-4xl md:text-5xl leading-[1.05]">
                <span className="block">
                  {isEn ? 'Welcome to Xamk' : 'Tervetuloa Xamk'}
                </span>
                <span className="block">
                  {isEn ? 'Game Room' : 'Game Roomiin'}
                </span>
              </h1>
            </div>

            <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] p-5 flex items-center gap-4 max-w-xl w-full">
              <div className="shrink-0">
                <XamkXEmblem />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold uppercase tracking-tight text-base sm:text-lg text-[#FACC15]">
                  {isEn
                    ? 'Opening hours Mon-Fri 08:00-18:00'
                    : 'Aukioloajat ma-pe klo 08:00-18:00'}
                </h2>
                <p
                  className="font-mono text-xs sm:text-sm text-[#F4F4F5] mt-1"
                  style={pinnedOrLatestNews ? { cursor: 'pointer' } : undefined}
                  onClick={() => {
                    if (pinnedOrLatestNews) {
                      scrollToSection('landing-news-col');
                    }
                  }}
                  title={pinnedOrLatestNews ? (isEn ? 'Click to view announcements' : 'Klikkaa siirtyäksesi tiedotteisiin') : undefined}
                >
                  {pinnedOrLatestNews
                    ? pinnedOrLatestNews.title
                    : t('landing.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Surface (#232323) */}
      {/* 3. Pääsisältöalue: pikakortit, valinnainen tilannetaulu, kirjautumislomake ja tiedotteet */}
      <main className="flex-1 bg-[#121417] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Esikatseltava reaaliaikainen tilannetaulu */}
          {showRealtimeStatus && (
            <div className="mb-10">
              <RealtimeStatus
                onOpenFloorPlan={onOpenFloorPlan}
                onNavigateToBooking={focusLoginInput}
              />
            </div>
          )}

          {/* Two-Column Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Kirjaudu sisään pelihuoneeseen */}
            <section
              className="lg:col-span-6 rounded-none bg-white text-[#09090B] border-2 border-black shadow-[5px_5px_0px_#FACC15] p-6 sm:p-7 flex flex-col gap-5"
              aria-labelledby="heading-landing-login"
            >
              <div>
                <h2
                  id="heading-landing-login"
                  className="font-extrabold uppercase tracking-tight text-2xl text-[#09090B]"
                >
                  {t('landing.loginHeader')}
                </h2>
                <div className="h-1.5 w-16 bg-[#FACC15] border border-black mt-2" />
              </div>

              {errorMessage && (
                <div
                  className="rounded-none border-2 border-black p-3.5 font-mono text-xs font-bold flex items-center gap-2.5 bg-[#EF4444] text-white"
                  role="alert"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && (
                <div
                  className="rounded-none border-2 border-black p-3.5 font-mono text-xs font-bold flex items-center gap-2.5 bg-[#22C55E] text-[#09090B]"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {devCodeHint && (
                <div
                  className="rounded-none border-2 border-black p-3.5 font-mono text-xs font-bold flex items-center gap-2.5 bg-[#FACC15] text-[#09090B]"
                  role="status"
                >
                  <Wrench className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  <span>
                    {t('login.devCodeHint')} <strong>{devCodeHint}</strong>
                  </span>
                </div>
              )}

              {/* 2-Segment Login Step Bar (shadcn/ui Tabs) */}
              <div className="flex flex-col gap-2">
                <Label className="text-[#09090B]">{t('landing.loginNotice')}</Label>
                <Tabs
                  value={String(step)}
                  onValueChange={(val) => {
                    if (val === '1') setStep(1);
                    else if (val === '2' && email.trim()) setStep(2);
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="1">
                      <span className="hidden sm:inline">{isEn ? '1. University email' : '1. Koulun sähköposti'}</span>
                      <span className="sm:hidden">{isEn ? '1. Email' : '1. Sähköposti'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="2">
                      <span className="hidden sm:inline">{isEn ? '2. Verification code' : '2. Vahvistuskoodi'}</span>
                      <span className="sm:hidden">{isEn ? '2. Code' : '2. Koodi'}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {step === 1 ? (
                <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="landing-email" className="text-[#09090B]">{t('login.emailLabel')} *</Label>
                      <div className="w-full">
                        <input
                          id="landing-email"
                          type="email"
                          className="w-full min-h-[44px] rounded-none bg-white text-[#09090B] font-mono text-sm font-bold placeholder:text-[#6B7280] px-3 py-2 border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15] disabled:opacity-50"
                          placeholder={t('login.emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="landing-name" className="text-[#09090B]">{t('login.nameLabel')}</Label>
                      <div className="w-full">
                        <input
                          id="landing-name"
                          type="text"
                          className="w-full min-h-[44px] rounded-none bg-white text-[#09090B] font-mono text-sm font-bold placeholder:text-[#6B7280] px-3 py-2 border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15] disabled:opacity-50"
                          placeholder={t('login.namePlaceholder')}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Connected 2-Tier Gold-Bottom-Bordered Info Box */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[#09090B]">{t('login.allowedHint')}</Label>
                    <div className="rounded-none border-2 border-black bg-[#F4F4F5] text-[#09090B]">
                      <div className="border-b-2 border-black px-3 py-2.5 font-mono text-xs font-bold flex items-center justify-between">
                        <span>@edu.xamk.fi / @xamk.fi</span>
                        <span className="bg-[#FACC15] text-[#09090B] border border-black px-2 py-0.5 uppercase">
                          {isEn ? 'One-time code' : 'Kertakoodi'}
                        </span>
                      </div>
                      <div className="px-3 py-2 text-xs text-[#374151]">
                        <span>{t('login.sessionNotice')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Button type="submit" variant="pill" disabled={isLoading}>
                      <span>{isLoading ? t('common.submitting') : t('login.sendCode')}</span>
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="landing-code" className="text-[#09090B]">
                      {t('login.step2')} ({email}) *
                    </Label>
                    <div className="w-full">
                      <input
                        id="landing-code"
                        type="text"
                        maxLength={6}
                        className="w-full min-h-[44px] rounded-none bg-white text-[#09090B] font-mono text-base font-bold tracking-widest placeholder:text-[#6B7280] px-3 py-2 border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15] disabled:opacity-50"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <Button type="submit" variant="pill" disabled={isLoading}>
                      <span>{isLoading ? t('common.verifying') : t('login.verifyCode')}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStep(1)}
                    >
                      {t('login.changeEmail')}
                    </Button>
                  </div>
                </form>
              )}

              {/* Quick Dev Login Station-Style Cards */}
              <div className="mt-2">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#09090B] mb-2">{t('landing.quickDevLogin')}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="station"
                    onClick={() => handleInstantLogin('opiskelija@edu.xamk.fi', 'Matti Meikäläinen')}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex items-center justify-center text-[#FACC15] shrink-0" aria-hidden="true">
                        <User className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                      <span className="truncate font-bold text-sm text-[#F4F4F5]">Matti Meikäläinen</span>
                    </div>
                    <Badge variant="status">USER</Badge>
                  </Button>

                  <Button
                    type="button"
                    variant="station"
                    onClick={() => handleInstantLogin('admin@xamk.fi', 'Pääkäyttäjä')}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex items-center justify-center text-[#FACC15] shrink-0" aria-hidden="true">
                        <Zap className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                      <span className="truncate font-bold text-sm text-[#F4F4F5]">SuperAdmin</span>
                    </div>
                    <Badge variant="status">ADMIN</Badge>
                  </Button>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: Uutiset ja tiedotteet + Pelisäännöt */}
            <section
              id="landing-news-col"
              className="lg:col-span-6 flex flex-col gap-5"
              aria-labelledby="heading-landing-news"
            >
              <div>
                <h2
                  id="heading-landing-news"
                  className="font-extrabold uppercase tracking-tight text-2xl text-[#F4F4F5]"
                >
                  {t('landing.newsHeader')}
                </h2>
                <div className="h-1.5 w-16 bg-[#FACC15] mt-2" />
              </div>

              <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                {newsItems
                  ? `${newsItems.length} ${t('landing.announcementsCount')}`
                  : t('common.loading')}
              </div>

              {isNewsLoading ? (
                <div className="rounded-none bg-[#1C1F24] border border-[#3F444E] p-6 font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  <span>{t('common.loading')}</span>
                </div>
              ) : newsItems && newsItems.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {newsItems.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-none bg-white text-[#09090B] border-2 border-black shadow-[5px_5px_0px_#FACC15] p-5 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="status">
                          {item.isPinned ? t('news.pinned') : t('news.badge')}
                        </Badge>
                        <time className="font-mono text-xs font-bold text-[#4B5563]">
                          {new Date(item.createdAtUtc).toLocaleDateString(
                            isEn ? 'en-GB' : 'fi-FI',
                            {
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </time>
                      </div>
                      <h3 className="font-extrabold uppercase tracking-tight text-lg text-[#09090B]">{item.title}</h3>
                      <p className="font-sans text-sm text-[#1F2937] leading-relaxed whitespace-pre-line">{item.content}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-none bg-white text-[#09090B] border-2 border-black shadow-[5px_5px_0px_#FACC15] p-5 flex flex-col gap-2.5">
                  <p className="font-sans text-sm text-[#1F2937] leading-relaxed whitespace-pre-line">{t('landing.noAnnouncements')}</p>
                </div>
              )}
            </section>
          </div>

          {/* 2-Column Quick Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10">
            <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-5 flex flex-col items-start gap-2.5">
              <span className="inline-flex items-center justify-center rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black p-2" aria-hidden="true">
                <Map className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="font-extrabold uppercase tracking-tight text-sm text-[#F4F4F5]">{t('floorplan.title')}</span>
              <span className="text-xs text-[#9CA3AF] leading-relaxed">
                {isEn ? '6 PCs, PS5, Switch, and shared 4K TV' : '6 PC-pistettä, PS5, Switch ja yhteinen 4K-TV'}
              </span>
              <button
                type="button"
                className="mt-auto inline-flex items-center justify-center rounded-none font-mono text-xs font-extrabold uppercase border-2 border-black shadow-[3px_3px_0px_#000000] transition-transform duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none px-3.5 py-2 min-h-[38px] cursor-pointer bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                onClick={onOpenFloorPlan}
              >
                <span>{t('floorplan.title')}</span>
              </button>
            </div>

            <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-5 flex flex-col items-start gap-2.5">
              <span className="inline-flex items-center justify-center rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black p-2" aria-hidden="true">
                <BookOpen className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="font-extrabold uppercase tracking-tight text-sm text-[#F4F4F5]">
                {isEn ? 'Rules and guide' : 'Tilan ohjeet ja säännöt'}
              </span>
              <span className="text-xs text-[#9CA3AF] leading-relaxed">
                {isEn ? 'Usage rules, PC and console instructions, and shared 4K TV guide' : 'Käyttösäännöt, PC- ja konsoliohjeet sekä yhteisen 4K-TV:n ohjeistus'}
              </span>
              <button
                type="button"
                className="mt-auto inline-flex items-center justify-center rounded-none font-mono text-xs font-extrabold uppercase border-2 border-black shadow-[3px_3px_0px_#000000] transition-transform duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none px-3.5 py-2 min-h-[38px] cursor-pointer bg-[#FACC15] text-[#09090B] hover:bg-[#EAB308]"
                onClick={() => setShowRulesGuide((prev) => !prev)}
              >
                <span>{showRulesGuide ? t('common.close') : (isEn ? 'Rules and guide' : 'Tilan ohjeet ja säännöt')}</span>
              </button>
            </div>
          </div>

          {/* Esikatseltava tilan ohjeet ja säännöt -näkymä */}
          {showRulesGuide && (
            <div className="mt-6">
              <RulesAndGuide onOpenFloorPlan={() => onOpenFloorPlan?.()} />
            </div>
          )}
        </div>
      </main>

      {/* 4. Dark Band + Gold Top Line + 4-Column Xamk Footer */}
      {/* 4. Alatunniste linkkeineen ja yhteystietoineen */}
      <div className="h-1.5 w-full bg-[#FACC15] border-y border-black" aria-hidden="true" />

      <footer className="bg-[#121417] text-[#F4F4F5] pt-10 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col">
            <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#FACC15] mb-3 flex items-center gap-2">
              {isEn ? 'Sign in' : 'Kirjautuminen'}
            </h3>
            <ul className="flex flex-col gap-2 list-none p-0 m-0 text-sm text-[#9CA3AF]">
              <li>
                <button
                  type="button"
                  className="bg-transparent border-0 p-0 text-left text-sm text-[#9CA3AF] hover:text-[#FACC15] cursor-pointer transition-colors"
                  onClick={focusLoginInput}
                >
                  {t('nav.login')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="bg-transparent border-0 p-0 text-left text-sm text-[#9CA3AF] hover:text-[#FACC15] cursor-pointer transition-colors"
                  onClick={() => scrollToSection('landing-news-col')}
                >
                  {isEn ? 'Announcements' : 'Tiedotteet'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="bg-transparent border-0 p-0 text-left text-sm text-[#9CA3AF] hover:text-[#FACC15] cursor-pointer transition-colors"
                  onClick={() => setShowRealtimeStatus(true)}
                >
                  {isEn ? 'Live status' : 'Tilan tilanne'}
                </button>
              </li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#FACC15] mb-3 flex items-center gap-2">
              {isEn ? 'Guides & room' : 'Ohjeet ja tila'}
            </h3>
            <ul className="flex flex-col gap-2 list-none p-0 m-0 text-sm text-[#9CA3AF]">
              <li>
                <button
                  type="button"
                  className="bg-transparent border-0 p-0 text-left text-sm text-[#9CA3AF] hover:text-[#FACC15] cursor-pointer transition-colors"
                  onClick={() => onOpenFloorPlan?.()}
                >
                  {isEn ? 'Floor plan' : 'Tilan pohjakuva'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="bg-transparent border-0 p-0 text-left text-sm text-[#9CA3AF] hover:text-[#FACC15] cursor-pointer transition-colors"
                  onClick={() => setShowRulesGuide(true)}
                >
                  {isEn ? 'Rules and guide' : 'Tilan ohjeet ja säännöt'}
                </button>
              </li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#FACC15] mb-3 flex items-center gap-2">
              {isEn ? 'Community & support' : 'Yhteisö ja tuki'}
            </h3>
            <ul className="flex flex-col gap-2 list-none p-0 m-0 text-sm text-[#9CA3AF]">
              <li>
                <a
                  href="https://discord.gg/xamk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-left text-sm text-[#9CA3AF] hover:text-[#FACC15] cursor-pointer transition-colors"
                >
                  <DiscordIcon className="w-4 h-4 shrink-0" />
                  Discord
                </a>
              </li>
              {onOpenIssueModal && (
                <li>
                  <button
                    type="button"
                    className="bg-transparent border-0 p-0 text-left text-sm text-[#9CA3AF] hover:text-[#FACC15] cursor-pointer transition-colors"
                    onClick={onOpenIssueModal}
                  >
                    {isEn ? 'Report issue' : 'Ilmoita viasta'}
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#FACC15] mb-3 flex items-center gap-2">
              Xamk Game Room <span className="bg-[#FACC15] text-[#09090B] px-1.5 py-0.5 text-[10px] font-mono font-extrabold border border-black">LOGIN</span>
            </h3>
            <ul className="flex flex-col gap-2 list-none p-0 m-0 text-sm text-[#9CA3AF]">
              <li>
                <span>
                  {isEn
                    ? 'South-Eastern Finland UAS'
                    : 'Kaakkois-Suomen ammattikorkeakoulu'}
                </span>
              </li>
              <li>
                <span>Kotka, Kouvola, Mikkeli, Savonlinna</span>
              </li>
              <li>
                <span>T: (05) 3555 39 88</span>
              </li>
              <li>
                <a
                  href="https://www.xamk.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-[#3B82F6] hover:underline"
                >
                  www.xamk.fi
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-[#3F444E] font-mono text-xs text-[#9CA3AF]">
          <span>
            {t('footer.school')}, Xamk Game Room,{' '}
            {isEn ? 'all for the future' : 'tulevaisuutta varten'}
          </span>
        </div>
      </footer>
    </div>
  );
};
