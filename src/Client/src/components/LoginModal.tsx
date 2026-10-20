import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <img src="/xamk-logo.png" alt="Xamk" className="modal-xamk-logo" />
            <h2>{t('login.title')}</h2>
          </div>
          <button
            type="button"
            className="btn-close btn-touch"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <p className="modal-description">
          {t('login.desc')} {t('login.sessionNotice')}
        </p>

        {/* Pikatunnukset */}
        <div className="quick-login-hints">
          <span className="quick-login-label">{t('login.tryQuick')}</span>
          <div className="quick-login-buttons">
            <button
              type="button"
              className="btn btn-secondary btn-touch quick-btn"
              onClick={() => handleQuickLogin('opiskelija@edu.xamk.fi', 'Matti Meikäläinen')}
              disabled={loading}
            >
              {t('login.quickStudent')}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-touch quick-btn"
              onClick={() => handleQuickLogin('admin@xamk.fi', 'Pääkäyttäjä')}
              disabled={loading}
            >
              {t('login.quickAdmin')}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {step === 1 ? (
          /* VAIHE 1: Sähköpostin syöttö */
          <form onSubmit={handleSendCode} className="form">
            <div className="step-indicator">
              <span className="step-badge active">1</span>
              <span className="step-title">{t('login.step1')}</span>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('login.emailLabel')}</label>
              <input
                id="email"
                type="email"
                className="input-touch"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <span className="form-hint">{t('login.allowedHint')}</span>
            </div>

            <div className="form-group">
              <label htmlFor="displayName">{t('login.nameLabel')}</label>
              <input
                id="displayName"
                type="text"
                className="input-touch"
                placeholder={t('login.namePlaceholder')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-touch"
                onClick={onClose}
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-touch"
                disabled={loading}
              >
                {loading ? t('common.submitting') : t('login.sendCode')}
              </button>
            </div>
          </form>
        ) : (
          /* VAIHE 2: 6-numeroinen vahvistuskoodi */
          <form onSubmit={handleVerifyCode} className="form">
            <div className="step-indicator">
              <span className="step-badge active">2</span>
              <span className="step-title">{t('login.step2')}</span>
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

            <div className="form-group">
              <label htmlFor="otp-code">{t('login.enterCodeLabel')}</label>
              <input
                id="otp-code"
                type="text"
                className="input-touch code-input"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-touch"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                {t('common.back')}
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-touch"
                disabled={loading}
              >
                {loading ? t('common.verifying') : t('login.verifyCode')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
