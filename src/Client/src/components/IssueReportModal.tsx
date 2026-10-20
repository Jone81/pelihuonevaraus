import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IssueReportModal: React.FC<IssueReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  const targetOptions = useMemo(() => [
    'PC 1',
    'PC 2',
    'PC 3',
    'PC 4',
    'PC 5',
    'PC 6',
    'PlayStation 5',
    'Nintendo Switch',
    t('issue.targetConsole'),
    t('issue.targetNetwork'),
    t('issue.targetFurniture'),
    t('issue.targetOther'),
  ], [t]);

  const [target, setTarget] = useState('PC 1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState(user?.displayName || '');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage(t('issue.validationError'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.createIssueReport({
        target,
        title: title.trim(),
        description: description.trim(),
        reporterName: reporterName.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined,
      });

      setSuccessMessage(t('issue.success'));
      setTitle('');
      setDescription('');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2500);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          isEn
            ? 'Failed to send bug report. Please try again.'
            : 'Vikailmoituksen lähetys epäonnistui. Yritä uudelleen.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content issue-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{t('issue.title')}</h2>
            <p className="modal-subtitle">{t('issue.desc')}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        {successMessage ? (
          <div className="alert alert-success" style={{ margin: '1.5rem 0' }}>
            <span>✅</span>
            <div>
              <strong>{successMessage}</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                {t('issue.successDetail')}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="issue-form">
            {errorMessage && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="issue-target">{t('issue.target')} *</label>
              <select
                id="issue-target"
                className="form-control"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              >
                {targetOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="issue-title">{t('issue.reportTitle')} *</label>
              <input
                id="issue-title"
                type="text"
                className="form-control"
                placeholder={t('issue.reportTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="issue-desc">{t('issue.description')} *</label>
              <textarea
                id="issue-desc"
                className="form-control"
                rows={4}
                placeholder={t('issue.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="issue-name">{t('issue.name')}</label>
                <input
                  id="issue-name"
                  type="text"
                  className="form-control"
                  placeholder={isEn ? 'John Doe' : 'Matti Meikäläinen'}
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="issue-email">{t('issue.email')}</label>
                <input
                  id="issue-email"
                  type="email"
                  className="form-control"
                  placeholder="nimi@edu.xamk.fi"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ backgroundColor: '#d34320', borderColor: '#d34320' }}
              >
                {isSubmitting ? t('issue.submitting') : `🚀 ${t('issue.submit')}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
