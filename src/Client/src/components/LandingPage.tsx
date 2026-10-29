import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RealtimeStatus } from './RealtimeStatus';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { NewsItem } from '../types';

interface LandingPageProps {
  onOpenLogin?: () => void;
  onOpenIssueModal?: () => void;
  onOpenFloorPlan?: () => void;
}

const XamkXEmblem: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    width="54"
    height="54"
    aria-hidden="true"
    className="xamk-x-emblem-svg"
  >
    <path
      d="M6 6 H25 L32 13 L39 6 H58 V25 L51 32 L58 39 V58 H39 L32 51 L25 58 H6 V39 L13 32 L6 25 Z"
      fill="none"
      stroke="#e5a812"
      strokeWidth="3.2"
      strokeLinejoin="miter"
    />
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenIssueModal,
  onOpenFloorPlan,
}) => {
  const { login, verifyCodeAndLogin, sendVerificationCode } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showRealtimeStatus, setShowRealtimeStatus] = useState(false);

  const { data: newsItems, isLoading: isNewsLoading } = useQuery<NewsItem[]>({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
  });

  const focusLoginInput = () => {
    const el = document.getElementById('landing-email');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    } else if (onOpenLogin) {
      onOpenLogin();
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage(
        isEn ? 'Please enter your university email address.' : 'Anna koulun sähköpostiosoite.'
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
            ? 'Failed to send verification code. Please check your email address.'
            : 'Koodin lähetys epäonnistui. Tarkista sähköpostiosoite.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          isEn ? 'Login failed. Please check the code.' : 'Kirjautuminen epäonnistui. Tarkista koodi.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantLogin = async (testEmail: string, testName: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login(testEmail, testName);
    } catch {
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
    <div className="xamk-app-shell">
      {/* 1. Single-Row Top Navigation Bar (Only Brand, LanguageSwitcher, and Login Button when not logged in) */}
      <header className="xamk-topbar">
        <div className="xamk-topbar-inner">
          <button
            type="button"
            className="xamk-brand-btn min-w-0 flex-shrink"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="/xamk_logo_tiivis_kehys_keltainen_rgb.png"
              alt="Xamk"
              className="xamk-logo-img h-6 sm:h-7 md:h-8 w-auto object-contain flex-shrink-0"
            />
            <div className="xamk-brand-titles min-w-0">
              <span className="xamk-brand-main text-[11px] sm:text-xs md:text-sm font-extrabold uppercase truncate">
                {isEn ? 'GAME ROOM BOOKING' : 'PELIHUONEVARAUS'}
              </span>
              <span className="xamk-brand-sub text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-widest uppercase truncate">
                XAMK GAME ROOM
              </span>
            </div>
          </button>

          <div className="xamk-topbar-right flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <LanguageSwitcher className="mobile-lang-switcher" />

            <Button
              type="button"
              variant="pill"
              size="sm"
              className="btn-touch"
              onClick={() => (onOpenLogin ? onOpenLogin() : focusLoginInput())}
            >
              <span className="hidden sm:inline">{t('nav.login')}</span>
              <span className="sm:hidden">{isEn ? 'Log in' : 'Kirjaudu'}</span>
              <span className="confirm-arrow hidden sm:inline" aria-hidden="true">→</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Banner */}
      <section className="xamk-hero-banner" aria-label={t('landing.welcome')}>
        <div className="xamk-hero-overlay">
          <div className="xamk-hero-container">
            <div className="xamk-hero-headline-group">
              <h1 className="xamk-hero-title">
                <span className="xamk-highlight-strip">
                  {isEn ? 'Welcome to Xamk' : 'Tervetuloa Xamk'}
                </span>
                <span className="xamk-highlight-strip">
                  {isEn ? 'Game Room!' : 'Game Roomiin!'}
                </span>
              </h1>
            </div>

            <div className="xamk-hero-info-box">
              <div className="xamk-hero-emblem-wrap">
                <XamkXEmblem />
              </div>
              <div className="xamk-hero-info-text">
                <h2 className="xamk-hero-info-heading">
                  {isEn
                    ? 'Opening hours Mon–Fri 08:00–18:00'
                    : 'Aukioloajat ma–pe klo 08:00–18:00'}
                </h2>
                <p className="xamk-hero-info-sub">{t('landing.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Surface (#232323) */}
      <main className="xamk-main-surface">
        <div className="xamk-main-container">
          {/* 4-Column Quick Highlights Bar */}
          <div className="xamk-landing-features-row">
            <div className="xamk-feature-mini-card">
              <span className="feature-mini-icon" aria-hidden="true">⏰</span>
              <span className="feature-mini-title">{t('landing.hoursTitle')}</span>
              <span className="feature-mini-sub">{t('landing.hoursValue')}</span>
              <button
                type="button"
                className="xamk-mini-pill-btn btn-touch"
                onClick={focusLoginInput}
              >
                <span>{t('nav.login')}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="xamk-feature-mini-card">
              <span className="feature-mini-icon" aria-hidden="true">🖥️</span>
              <span className="feature-mini-title">{t('landing.equipmentTitle')}</span>
              <span className="feature-mini-sub">{t('landing.equipmentValue')}</span>
              <button
                type="button"
                className="xamk-mini-pill-btn btn-touch"
                onClick={() => setShowRealtimeStatus((prev) => !prev)}
              >
                <span>{showRealtimeStatus ? t('common.close') : t('landing.statusPreview')}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="xamk-feature-mini-card">
              <span className="feature-mini-icon" aria-hidden="true">🗺️</span>
              <span className="feature-mini-title">{t('floorplan.title')}</span>
              <span className="feature-mini-sub">
                {isEn ? '6 PCs, PS5, Switch & Shared 4K TV' : '6 PC-pistettä, PS5, Switch & 4K TV'}
              </span>
              <button
                type="button"
                className="xamk-mini-pill-btn btn-touch"
                onClick={onOpenFloorPlan}
              >
                <span>{t('floorplan.title')}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="xamk-feature-mini-card">
              <span className="feature-mini-icon" aria-hidden="true">💬</span>
              <span className="feature-mini-title">Xamk Gaming Discord</span>
              <span className="feature-mini-sub">
                {isEn ? 'Tournaments, LFG & announcements' : 'Turnaukset, peliseura & tiedotteet'}
              </span>
              <a
                href="https://discord.gg/xamk"
                target="_blank"
                rel="noopener noreferrer"
                className="xamk-mini-pill-btn btn-touch"
              >
                <span>Discord</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {showRealtimeStatus && (
            <div className="mb-10">
              <RealtimeStatus
                onOpenFloorPlan={onOpenFloorPlan}
                onNavigateToBooking={focusLoginInput}
              />
            </div>
          )}

          {/* Two-Column Main Grid */}
          <div className="xamk-booking-grid-layout">
            {/* LEFT COLUMN: Kirjaudu sisään pelihuoneeseen */}
            <section className="xamk-booking-left-col" aria-labelledby="heading-landing-login">
              <div className="xamk-section-heading">
                <h2 id="heading-landing-login">{t('landing.loginHeader')}</h2>
                <div className="xamk-heading-underline" />
              </div>

              {errorMessage && (
                <div className="alert alert-error" role="alert">
                  ⚠️ {errorMessage}
                </div>
              )}

              {statusMessage && (
                <div className="alert alert-success" role="status">
                  ✉️ {statusMessage}
                </div>
              )}

              {devCodeHint && (
                <div className="alert alert-warning" role="status">
                  🛠️ {t('login.devCodeHint')} <strong>{devCodeHint}</strong>
                </div>
              )}

              {/* 3-Segment Login Step Bar (shadcn/ui Tabs) */}
              <div className="xamk-field-group mb-4">
                <Label>{t('landing.loginNotice')}</Label>
                <Tabs
                  value={String(step)}
                  onValueChange={(val) => {
                    if (val === 'floorplan') {
                      onOpenFloorPlan?.();
                      return;
                    }
                    if (val === '1') setStep(1);
                    else if (val === '2' && email.trim()) setStep(2);
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="1">
                      <span className="hidden sm:inline">{isEn ? '1. University Email' : '1. Koulun sähköposti'}</span>
                      <span className="sm:hidden">{isEn ? '1. Email' : '1. Sähköposti'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="2">
                      <span className="hidden sm:inline">{isEn ? '2. Verification Code' : '2. Vahvistuskoodi'}</span>
                      <span className="sm:hidden">{isEn ? '2. Koodi' : '2. Koodi'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="floorplan">
                      <span className="hidden sm:inline">{t('floorplan.title')}</span>
                      <span className="sm:hidden">{isEn ? 'Map' : 'Kartta'}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {step === 1 ? (
                <form onSubmit={handleSendCode} className="xamk-booking-form-clean">
                  <div className="xamk-two-col-fields">
                    <div className="xamk-field-group">
                      <Label htmlFor="landing-email">{t('login.emailLabel')} *</Label>
                      <div className="xamk-gold-input-box">
                        <input
                          id="landing-email"
                          type="email"
                          className="xamk-clean-input btn-touch"
                          placeholder={t('login.emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="xamk-field-group">
                      <Label htmlFor="landing-name">{t('login.nameLabel')}</Label>
                      <div className="xamk-gold-input-box">
                        <input
                          id="landing-name"
                          type="text"
                          className="xamk-clean-input btn-touch"
                          placeholder={t('login.namePlaceholder')}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Connected 2-Tier Gold-Bottom-Bordered Info Box */}
                  <div className="xamk-field-group">
                    <Label>{t('login.allowedHint')}</Label>
                    <div className="xamk-double-gold-box">
                      <div className="xamk-double-box-top px-3 py-2.5 text-xs text-[#cfd2d8] flex items-center justify-between">
                        <span>📧 @edu.xamk.fi / @xamk.fi</span>
                        <span className="text-[#d49a15] font-semibold">OTP / Kertakoodi</span>
                      </div>
                      <div className="xamk-double-box-bottom px-3 py-2 text-xs text-[#9da3ae]">
                        <span>{t('login.sessionNotice')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="xamk-submit-row">
                    <Button type="submit" variant="pill" disabled={isLoading}>
                      <span>{isLoading ? t('common.submitting') : t('login.sendCode')}</span>
                      <span className="confirm-arrow" aria-hidden="true">→</span>
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="xamk-booking-form-clean">
                  <div className="xamk-field-group">
                    <Label htmlFor="landing-code">
                      {t('login.step2')} ({email}) *
                    </Label>
                    <div className="xamk-gold-input-box">
                      <input
                        id="landing-code"
                        type="text"
                        maxLength={6}
                        className="xamk-clean-input btn-touch font-mono tracking-widest text-base"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="xamk-submit-row flex items-center gap-3">
                    <Button type="submit" variant="pill" disabled={isLoading}>
                      <span>{isLoading ? t('common.verifying') : t('login.verifyCode')}</span>
                      <span className="confirm-arrow" aria-hidden="true">→</span>
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
              <div className="mt-6">
                <div className="xamk-schedule-sublabel mb-2">{t('landing.quickDevLogin')}</div>
                <div className="xamk-stations-8grid">
                  <Button
                    type="button"
                    variant="station"
                    onClick={() => handleInstantLogin('opiskelija@edu.xamk.fi', 'Matti Meikäläinen')}
                    disabled={isLoading}
                  >
                    <div className="xamk-station-card-left">
                      <span className="station-svg-icon" aria-hidden="true">🎓</span>
                      <span className="xamk-station-card-name">Matti Meikäläinen</span>
                    </div>
                    <Badge variant="status">USER →</Badge>
                  </Button>

                  <Button
                    type="button"
                    variant="station"
                    onClick={() => handleInstantLogin('admin@xamk.fi', 'Pääkäyttäjä')}
                    disabled={isLoading}
                  >
                    <div className="xamk-station-card-left">
                      <span className="station-svg-icon" aria-hidden="true">⚡</span>
                      <span className="xamk-station-card-name">SuperAdmin</span>
                    </div>
                    <Badge variant="status">ADMIN →</Badge>
                  </Button>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: Uutiset & Tiedotteet + Pelisäännöt */}
            <section
              id="landing-news-col"
              className="xamk-booking-right-col"
              aria-labelledby="heading-landing-news"
            >
              <div className="xamk-section-heading">
                <h2 id="heading-landing-news">{t('landing.newsHeader')}</h2>
                <div className="xamk-heading-underline" />
              </div>

              <div className="xamk-schedule-sublabel">
                {newsItems
                  ? `${newsItems.length} ${t('landing.announcementsCount')}`
                  : t('common.loading')}
              </div>

              {isNewsLoading ? (
                <div className="loading-state">
                  <span>{t('common.loading')}</span>
                </div>
              ) : newsItems && newsItems.length > 0 ? (
                <div className="xamk-landing-news-stack">
                  {newsItems.map((item) => (
                    <article key={item.id} className="xamk-landing-news-card">
                      <div className="xamk-landing-news-top">
                        <Badge variant="status">
                          {item.isPinned ? t('news.pinned') : t('news.badge')}
                        </Badge>
                        <time className="xamk-landing-news-date">
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
                      <h3 className="xamk-landing-news-title">{item.title}</h3>
                      <p className="xamk-landing-news-body">{item.content}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="xamk-landing-news-card">
                  <p className="xamk-landing-news-body">{t('landing.noAnnouncements')}</p>
                </div>
              )}

              {/* Rules Summary Cards in the 2x2 Station-Card Grid Style */}
              <div id="landing-rules-grid" className="mt-5">
                <div className="xamk-schedule-sublabel mb-2">{t('landing.rulesSummaryTitle')}</div>
                <div className="xamk-stations-8grid">
                  <div className="xamk-station-row-card">
                    <div className="xamk-station-card-left">
                      <span className="station-svg-icon" aria-hidden="true">📅</span>
                      <span className="xamk-station-card-name">
                        {isEn ? 'Book Before Playing' : 'Varaus ennen peliä'}
                      </span>
                    </div>
                    <Badge variant="status">Max 4h</Badge>
                  </div>

                  <div className="xamk-station-row-card">
                    <div className="xamk-station-card-left">
                      <span className="station-svg-icon" aria-hidden="true">🔒</span>
                      <span className="xamk-station-card-name">
                        {isEn ? 'Always Sign Out' : 'Muista uloskirjaus'}
                      </span>
                    </div>
                    <Badge variant="status">Steam</Badge>
                  </div>

                  <div className="xamk-station-row-card">
                    <div className="xamk-station-card-left">
                      <span className="station-svg-icon" aria-hidden="true">📺</span>
                      <span className="xamk-station-card-name">
                        {isEn ? 'Shared 4K TV' : 'Yhteinen 4K TV'}
                      </span>
                    </div>
                    <Badge variant="status">PS5 / SW</Badge>
                  </div>

                  <div className="xamk-station-row-card">
                    <div className="xamk-station-card-left">
                      <span className="station-svg-icon" aria-hidden="true">⏰</span>
                      <span className="xamk-station-card-name">
                        {isEn ? 'Mon–Fri 08–18' : 'Avoinna ma–pe'}
                      </span>
                    </div>
                    <Badge variant="status">08–18</Badge>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* 4. Dark Band + Gold Top Line + 6-Column Xamk Footer */}
      <div className="xamk-footer-gold-line" aria-hidden="true" />

      <footer className="xamk-footer">
        <div className="xamk-footer-grid">
          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">{isEn ? 'Book' : 'Varaa'}</h3>
            <ul className="xamk-footer-links">
              <li>
                <button type="button" onClick={focusLoginInput}>
                  {isEn ? 'Book Station' : 'Varaa laite'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setShowRealtimeStatus(true)}>
                  {isEn ? 'Live Status' : 'Tilan tilanne'}
                </button>
              </li>
              <li>
                <button type="button" onClick={focusLoginInput}>
                  {isEn ? 'Games & Wishlist' : 'Pelit & Toivelista'}
                </button>
              </li>
            </ul>
          </div>

          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">{isEn ? 'Home' : 'Tietoa'}</h3>
            <ul className="xamk-footer-links">
              <li>
                <button type="button" onClick={() => scrollToSection('landing-news-col')}>
                  {isEn ? 'Announcements' : 'Tiedotteet'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('landing-rules-grid')}>
                  {isEn ? 'Rules & Guide' : 'Pelisäännöt'}
                </button>
              </li>
            </ul>
          </div>

          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">{isEn ? 'Floor Plan' : 'Pohjakuva'}</h3>
            <ul className="xamk-footer-links">
              <li>
                <button type="button" onClick={() => onOpenFloorPlan?.()}>
                  {isEn ? 'Room Layout' : 'Tilan pohjakuva'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('landing-rules-grid')}>
                  {isEn ? 'Equipment' : 'Laitteisto'}
                </button>
              </li>
            </ul>
          </div>

          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">{isEn ? 'Community' : 'Omat tiedot'}</h3>
            <ul className="xamk-footer-links">
              <li>
                <a href="https://discord.gg/xamk" target="_blank" rel="noopener noreferrer">
                  Discord
                </a>
              </li>
              {onOpenIssueModal && (
                <li>
                  <button type="button" onClick={onOpenIssueModal}>
                    {isEn ? 'Report Issue' : 'Ilmoita viasta'}
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">Contact info</h3>
            <ul className="xamk-footer-links">
              <li>
                <span>
                  {isEn
                    ? 'South-Eastern Finland UAS'
                    : 'Kaakkois-Suomen ammattikorkeakoulu'}
                </span>
              </li>
              <li>
                <span>Xamk Game Room</span>
              </li>
              <li>
                <span>Kotka • Kouvola • Mikkeli • Savonlinna</span>
              </li>
            </ul>
          </div>

          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">
              Xamk Game Room <span className="xamk-footer-role">LOGIN</span>
            </h3>
            <ul className="xamk-footer-links">
              <li>
                <span>Kaakkois-Suomen ammattikorkeakoulu</span>
              </li>
              <li>
                <span>
                  {isEn ? 'All for the future' : 'Tulevaisuutta varten'}
                </span>
              </li>
              <li>
                <span>T: (05) 3555 39 88</span>
              </li>
              <li>
                <a
                  href="https://www.xamk.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="xamk-footer-domain-link"
                >
                  www.xamk.fi
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="xamk-footer-bottom-bar">
          <span>
            {t('footer.school')} • Xamk Game Room •{' '}
            {isEn ? 'All for the future' : 'Tulevaisuutta varten'}
          </span>
        </div>
      </footer>
    </div>
  );
};
