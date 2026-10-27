import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
import { HeroBanner } from './HeroBanner';
import { Footer } from './Footer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RealtimeStatus } from './RealtimeStatus';
import { RulesAndGuide } from './RulesAndGuide';
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Map,
  ArrowRight,
  Shield,
  KeyRound,
  Mail,
  User,
  GraduationCap,
  Activity,
  LogIn,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NewsItem } from '../types';

interface LandingPageProps {
  onOpenLogin?: () => void;
  onOpenIssueModal?: () => void;
  onOpenFloorPlan?: () => void;
}

const stripEmojis = (str: string) =>
  str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '').trim();

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenIssueModal,
  onOpenFloorPlan,
}) => {
  const { verifyCodeAndLogin, sendVerificationCode } = useAuth();
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
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hae uutiset ja tiedotteet
  const { data: newsItems, isLoading: isNewsLoading } = useQuery<NewsItem[]>({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage(isEn ? 'Please enter your university email address.' : 'Anna koulun sähköpostiosoite.');
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
      await verifyCodeAndLogin(email.trim(), code.trim(), displayName.trim() || undefined);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          isEn
            ? 'Login failed. Please check the code.'
            : 'Kirjautuminen epäonnistui. Tarkista koodi.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (testEmail: string, testName: string) => {
    setEmail(testEmail);
    setDisplayName(testName);
    setCode('123456');
    setDevCodeHint('123456');
    setStep(2);
  };

  const scrollToLogin = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else {
      const el = document.getElementById('landing-email');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0b0d] text-white">
      {/* 1. Landing Pagen erillinen yläpalkki (Muutos 1 & 2) */}
      <header className="w-full max-w-full overflow-hidden bg-[#0a0b0d] border-b border-[#1c1f26] sticky top-0 z-50 select-none">
        <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Logo & Otsikot (Muutos 1: Aina näkyvissä myös mobiilissa ilman katkeamista) */}
          <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group min-w-0 flex-shrink-0">
            <img
              src="/xamk-hero-logo.png"
              alt="Xamk Logo"
              className="h-6 sm:h-7 md:h-8 w-auto object-contain flex-shrink-0"
            />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-white font-extrabold tracking-wide text-[11px] sm:text-xs md:text-sm uppercase truncate">
                {t('nav.title')}
              </span>
              <span className="text-[#d89619] text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-widest uppercase truncate">
                {t('nav.subtitle')}
              </span>
            </div>
          </div>

          {/* Keskialue (Muutos 2: Vain pyydetyt 3 painiketta: Tilan tilanne, Tilan pohjakuva, Säännöt ja ohjeet) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#12141a]/90 backdrop-blur-md p-1 rounded-xl border border-[#262a36] min-w-0">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
              onClick={() => setIsStatusModalOpen(true)}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('nav.status')}</span>
            </button>

            {onOpenFloorPlan && (
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
                onClick={onOpenFloorPlan}
              >
                <Map className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('nav.floorplan')}</span>
              </button>
            )}

            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
              onClick={() => setIsRulesModalOpen(true)}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('nav.rules')}</span>
            </button>
          </nav>

          {/* Oikea laita: Kielivalitsin + Kirjaudu sisään + Mobiilihampurilainen */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            <LanguageSwitcher />

            <button
              type="button"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#d89619] hover:bg-[#c48410] active:bg-[#a66f0d] text-[#0a0b0d] font-bold text-xs uppercase tracking-wide cursor-pointer shadow-md flex items-center gap-1.5 flex-shrink-0"
              onClick={scrollToLogin}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.login')}</span>
              <span className="sm:hidden">{lang === 'en' ? 'Login' : 'Kirjaudu'}</span>
            </button>

            <button
              type="button"
              className="md:hidden p-1.5 rounded-lg bg-[#14161f] border border-[#2b313d] text-gray-300 hover:text-white cursor-pointer flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Valikko"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobiilivalikko Landing pagelle (Muutos 2 mobiilissa) */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0d0f14] border-t border-[#1c1f26] px-4 py-3 flex flex-col gap-2 max-w-full shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              type="button"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#14161f] border border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white flex items-center justify-between transition-all cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsStatusModalOpen(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0e1015] text-emerald-400 flex-shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.status')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            {onOpenFloorPlan && (
              <button
                type="button"
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#14161f] border border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white flex items-center justify-between transition-all cursor-pointer"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFloorPlan();
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#0e1015] text-amber-400 flex-shrink-0">
                    <Map className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.floorplan')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            )}

            <button
              type="button"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#14161f] border border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white flex items-center justify-between transition-all cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsRulesModalOpen(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0e1015] text-purple-400 flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.rules')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            <button
              type="button"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#d89619]/15 border border-[#d89619]/40 text-[#fbba18] font-bold flex items-center justify-between transition-all cursor-pointer mt-1"
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToLogin();
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#fbba18]/20 text-[#fbba18] flex-shrink-0">
                  <LogIn className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.login')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#fbba18]" />
            </button>
          </div>
        )}
      </header>

      {/* 2. Sama moderni HeroBanner */}
      <HeroBanner />

      {/* 3. KESKIALUE HARMAA (#23262d) */}
      <main className="flex-1 w-full max-w-full overflow-hidden bg-[#23262d] border-y border-[#181a20] py-6 sm:py-8 lg:py-10">
        <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* =========================================================
                VASEN KORTTI: Uutiset, Tiedotteet & Säännöt
                ========================================================= */}
            <div className="flex flex-col gap-6 min-w-0 max-w-full">
              {/* Uutislaatikko */}
              <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 md:p-7 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between pb-1 border-b border-[#2d323f]">
                  <div className="flex flex-col items-start">
                    <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-sans flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d89619]" />
                      <span>{t('landing.newsHeader')}</span>
                    </h2>
                    <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
                  </div>
                  {newsItems && newsItems.length > 0 && (
                    <span className="text-[10px] font-bold text-[#fbba18] bg-[#fbba18]/10 border border-[#fbba18]/30 px-2 py-0.5 rounded-full">
                      {newsItems.length} {t('landing.announcementsCount')}
                    </span>
                  )}
                </div>

                {isNewsLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <div className="w-6 h-6 border-2 border-[#d89619] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">{t('common.loading')}</span>
                  </div>
                ) : newsItems && newsItems.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {newsItems.map((item) => (
                      <article
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          item.isPinned
                            ? 'bg-[#fbba18]/5 border-[#d89619]/40 shadow-xs'
                            : 'bg-[#111318] border-[#2d323f]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          {item.isPinned ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#0a0b0d] bg-[#fbba18] px-1.5 py-0.5 rounded">
                              {t('news.pinned')}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                              {t('news.badge')}
                            </span>
                          )}
                          <time className="text-[10px] font-mono text-gray-400">
                            {new Date(item.createdAtUtc).toLocaleDateString(isEn ? 'en-GB' : 'fi-FI', {
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric',
                            })}
                          </time>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white mb-1">
                          {stripEmojis(item.title)}
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#111318] border border-[#2d323f] text-gray-400 text-xs text-center">
                    {t('landing.noAnnouncements')}
                  </div>
                )}
              </div>
            </div>

            {/* =========================================================
                OIKEA KORTTI: Kirjautumislomake (vastaa Tee uusi varaus -tyyliä)
                ========================================================= */}
            <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 md:p-7 shadow-xl flex flex-col gap-5 min-w-0 max-w-full">
              <div className="flex flex-col items-start pb-1">
                <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-sans flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#d89619]" />
                  <span>{t('landing.loginHeader')}</span>
                </h2>
                <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
                <p className="text-xs text-gray-400 mt-2">{t('landing.loginNotice')}</p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {devCodeHint && (
                <div className="p-3 rounded-xl bg-[#fbba18]/10 border border-[#fbba18]/30 text-[#fbba18] text-xs flex items-center justify-between">
                  <span>{t('login.devCodeHint')}</span>
                  <span className="font-mono font-bold text-sm tracking-widest">{devCodeHint}</span>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="landing-email" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#d89619]" />
                      <span>{t('login.emailLabel')} *</span>
                    </label>
                    <input
                      id="landing-email"
                      type="email"
                      placeholder={t('login.emailPlaceholder')}
                      className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#d89619] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                    <small className="text-[10px] text-gray-400">
                      {t('login.allowedHint')}
                    </small>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="landing-name" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>{t('login.nameLabel')}</span>
                    </label>
                    <input
                      id="landing-name"
                      type="text"
                      placeholder={t('login.namePlaceholder')}
                      className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#d89619] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="xamk"
                      size="lg"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] hover:brightness-110 active:scale-[0.99] text-[#0a0b0d] font-black text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(251,186,24,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <span>{isLoading ? t('common.submitting') : t('login.sendCode')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                  <div className="p-3 rounded-xl bg-[#111318] border border-[#2d323f] flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-[10px]">{t('login.codeSentAlert')}</span>
                      <strong className="text-white">{email}</strong>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-[#fbba18] hover:underline cursor-pointer"
                      onClick={() => setStep(1)}
                    >
                      {t('login.changeEmail')}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="landing-code" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-[#d89619]" />
                      <span>{t('login.enterCodeLabel')} *</span>
                    </label>
                    <input
                      id="landing-code"
                      type="text"
                      maxLength={6}
                      className="w-full h-12 bg-[#111318] border border-[#2d323f] focus:border-[#d89619] text-white text-center font-mono font-bold tracking-widest text-lg rounded-xl px-3 outline-none transition-colors"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="xamk"
                      size="lg"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] hover:brightness-110 active:scale-[0.99] text-[#0a0b0d] font-black text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(251,186,24,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <span>{isLoading ? t('common.verifying') : t('login.verifyCode')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Pikatunnukset kehitysympäristöön */}
              <div className="pt-3 border-t border-[#2d323f] flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('login.tryQuick')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#1c1f28] border border-[#2d323f] hover:border-[#fbba18]/60 text-gray-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    onClick={() => handleQuickLogin('opiskelija@edu.xamk.fi', 'Matti Opiskelija')}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('login.quickStudent')}</span>
                  </button>
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#1c1f28] border border-[#2d323f] hover:border-[#fbba18]/60 text-gray-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    onClick={() => handleQuickLogin('superadmin@xamk.fi', 'SuperAdmin Opettaja')}
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('login.quickAdmin')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Yhtenäinen Footer */}
      <Footer
        onOpenIssueModal={onOpenIssueModal}
        onOpenFloorPlan={onOpenFloorPlan}
      />

      {/* Tilan tilanne -modaali Landing pagelle (Muutos 2) */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d323f]">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                  {t('status.title')}
                </h2>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setIsStatusModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <RealtimeStatus
              onOpenFloorPlan={() => {
                setIsStatusModalOpen(false);
                onOpenFloorPlan?.();
              }}
              onNavigateToBooking={() => {
                setIsStatusModalOpen(false);
                scrollToLogin();
              }}
            />
          </div>
        </div>
      )}

      {/* Säännöt ja ohjeet -modaali Landing pagelle (Muutos 2) */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d323f]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                  {t('rules.title')}
                </h2>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setIsRulesModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <RulesAndGuide
              onOpenFloorPlan={() => {
                setIsRulesModalOpen(false);
                onOpenFloorPlan?.();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
