import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RealtimeStatus } from './RealtimeStatus';
import type { NewsItem } from '../types';

interface LandingPageProps {
  onOpenLogin?: () => void;
  onOpenIssueModal?: () => void;
  onOpenFloorPlan?: () => void;
}

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
  const [showRealtimeStatus, setShowRealtimeStatus] = useState(false);

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

  return (
    <div className="landing-page-root">
      {/* Yläpalkki / Header */}
      <header className="landing-header">
        <div className="landing-header-container">
          <div className="navbar-brand">
            <img src="/xamk-logo.png" alt="Xamk Logo" className="navbar-xamk-logo" />
            <div className="navbar-brand-text">
              <span className="navbar-title">Xamk Game Room</span>
              <span className="navbar-subtitle">{t('nav.subtitle')}</span>
            </div>
          </div>

          <div className="landing-header-actions">
            {/* Kielivalitsin maiden lipuilla (FI / EN) */}
            <LanguageSwitcher />

            {/* Kirjautumispainike */}
            <button
              type="button"
              className="btn btn-primary btn-touch landing-header-login-btn"
              onClick={() => {
                if (onOpenLogin) {
                  onOpenLogin();
                } else {
                  const el = document.getElementById('landing-email');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el?.focus();
                }
              }}
              aria-label={t('nav.login')}
            >
              {t('nav.login')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero esittelybanneri */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <span className="badge badge-accent">Gaming Lounge & Community</span>
          <h1 className="landing-hero-title">{t('landing.welcome')}</h1>
          <p className="landing-hero-subtitle">{t('landing.subtitle')}</p>

          <div className="landing-info-pills">
            <div className="info-pill">
              <span className="info-pill-icon">⏰</span>
              <div>
                <strong>{t('landing.hoursTitle')}</strong> {t('landing.hoursValue')}
              </div>
            </div>
            <div className="info-pill">
              <span className="info-pill-icon">🖥️</span>
              <div>
                <strong>{t('landing.equipmentTitle')}</strong> {t('landing.equipmentValue')}
              </div>
            </div>
            <button
              type="button"
              className={`info-pill btn-touch info-pill-btn ${showRealtimeStatus ? 'info-pill-active' : ''}`}
              onClick={() => setShowRealtimeStatus((prev) => !prev)}
              title={t('status.title')}
            >
              <span className="info-pill-icon">🟢</span>
              <div>
                <strong>{showRealtimeStatus ? t('common.close') : t('nav.status')}</strong>
              </div>
            </button>

            {onOpenFloorPlan && (
              <button
                type="button"
                className="info-pill btn-touch info-pill-btn"
                onClick={onOpenFloorPlan}
                title={t('landing.openFloorPlan')}
              >
                <span className="info-pill-icon">🗺️</span>
                <div>
                  <strong>{t('nav.floorplan')}</strong>
                </div>
              </button>
            )}
            <div className="info-pill">
              <span className="info-pill-icon">💬</span>
              <div>
                <a
                  href="https://discord.gg/xamk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-discord-link"
                >
                  {t('landing.discordLink')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tilan tilanne ja päivän varaukset avattuna esikatseluna myös ennen kirjautumista */}
      {showRealtimeStatus && (
        <section className="landing-status-section">
          <div className="landing-status-wrapper">
            <RealtimeStatus
              onOpenFloorPlan={onOpenFloorPlan}
              onNavigateToBooking={onOpenLogin}
            />
          </div>
        </section>
      )}

      {/* Pääosio: 2-palstainen jako (Uutiset vasemmalla, Kirjautuminen oikealla) */}
      <main className="landing-main-grid">
        {/* Vasen palsta: Uutiset & Tiedotteet */}
        <section className="landing-news-section">
          <div className="landing-section-header">
            <h2>{t('landing.newsHeader')}</h2>
            <span className="news-count-badge">
              {newsItems ? `${newsItems.length} ${t('landing.announcementsCount')}` : ''}
            </span>
          </div>

          {isNewsLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>{t('common.loading')}</span>
            </div>
          ) : newsItems && newsItems.length > 0 ? (
            <div className="news-cards-list">
              {newsItems.map((item) => (
                <article
                  key={item.id}
                  className={`news-card ${item.isPinned ? 'news-card-pinned' : ''}`}
                >
                  <div className="news-card-header">
                    {item.isPinned && <span className="pinned-badge">{t('news.pinned')}</span>}
                    <time className="news-date">
                      {new Date(item.createdAtUtc).toLocaleDateString(isEn ? 'en-GB' : 'fi-FI', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <h3 className="news-title">{item.title}</h3>
                  <div className="news-content-body">
                    {item.content}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <p>{t('landing.noAnnouncements')}</p>
            </div>
          )}

          {/* Lisätietokortti säännöistä ja käytännöistä */}
          <div className="landing-guide-box">
            <h4>{t('landing.rulesSummaryTitle')}</h4>
            <ul>
              <li>{t('landing.rule1')}</li>
              <li>{t('landing.rule2')}</li>
              <li>{t('landing.rule3')}</li>
              <li>{t('landing.rule4')}</li>
            </ul>
          </div>
        </section>

        {/* Oikea palsta: Kirjautumislomake */}
        <section className="landing-login-section">
          <div className="landing-login-card">
            <div className="landing-login-card-header">
              <div className="login-icon-circle">🔐</div>
              <h2>{t('landing.loginHeader')}</h2>
              <p className="landing-login-desc">{t('landing.loginNotice')}</p>
            </div>

            {errorMessage && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {statusMessage && (
              <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                <span>✉️</span>
                <span>{statusMessage}</span>
              </div>
            )}

            {devCodeHint && (
              <div className="dev-code-banner">
                <span>🛠️ {t('login.devCodeHint')} <strong>{devCodeHint}</strong></span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendCode} className="login-form-inner">
                <div className="form-group">
                  <label htmlFor="landing-email">{t('login.step1')} *</label>
                  <input
                    id="landing-email"
                    type="email"
                    className="form-control"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                  <small className="form-hint">
                    {t('login.allowedHint')}
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="landing-name">{t('login.nameLabel')}</label>
                  <input
                    id="landing-name"
                    type="text"
                    className="form-control"
                    placeholder={t('login.namePlaceholder')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-touch"
                  disabled={isLoading}
                  style={{ marginTop: '0.5rem' }}
                >
                  {isLoading ? t('common.submitting') : `📨 ${t('login.sendCode')}`}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="login-form-inner">
                <div className="login-target-email">
                  <span>{t('login.codeSentAlert')}</span>
                  <strong>{email}</strong>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setStep(1)}
                  >
                    {t('login.changeEmail')}
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="landing-code">{t('login.step2')} *</label>
                  <input
                    id="landing-code"
                    type="text"
                    maxLength={6}
                    className="form-control otp-input"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                  <small className="form-hint">{t('login.codeHint')}</small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-touch"
                  disabled={isLoading}
                >
                  {isLoading ? t('common.verifying') : `🚀 ${t('login.verifyCode')}`}
                </button>
              </form>
            )}

            {/* Testipikatunnukset kehitystä varten */}
            <div className="quick-login-box">
              <span className="quick-login-label">{t('landing.quickDevLogin')}</span>
              <div className="quick-buttons-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickLogin('opiskelija@edu.xamk.fi', 'Matti Opiskelija')}
                >
                  {t('login.quickStudent')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickLogin('superadmin@xamk.fi', 'SuperAdmin Opettaja')}
                >
                  {t('login.quickAdmin')}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <span>{t('footer.school')}</span>
          <span className="footer-separator">•</span>
          <span className="footer-gold">Xamk Game Room</span>
          <span className="footer-separator">•</span>
          {onOpenIssueModal && (
            <>
              <button
                type="button"
                className="footer-link-btn"
                onClick={onOpenIssueModal}
              >
                {t('footer.report')}
              </button>
              <span className="footer-separator">•</span>
            </>
          )}
          <a
            href="https://discord.gg/xamk"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-discord-link"
          >
            {t('footer.discord')}
          </a>
        </div>
      </footer>
    </div>
  );
};
