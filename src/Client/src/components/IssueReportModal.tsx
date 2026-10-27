import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
  User,
  Mail,
  HelpCircle,
  FileText,
} from 'lucide-react';

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
      }, 2000);
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#2d323f]">
          <div className="flex flex-col">
            <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#fbba18]" />
              <span>{t('issue.title')}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">{t('issue.desc')}</p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Kohde */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-[#d89619]" />
              <span>{t('issue.target')} *</span>
            </label>
            <select
              className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors cursor-pointer"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              {targetOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Otsikko */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#d89619]" />
              <span>{t('issue.reportTitle')} *</span>
            </label>
            <input
              type="text"
              placeholder={t('issue.reportTitlePlaceholder')}
              className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Kuvaus */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {t('issue.description')} *
            </label>
            <textarea
              rows={4}
              placeholder={t('issue.descriptionPlaceholder')}
              className="w-full bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl p-3 text-xs outline-none transition-colors resize-none leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Yhteystiedot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-gray-400" />
                <span>{t('issue.name')}</span>
              </label>
              <input
                type="text"
                placeholder="Matti Meikäläinen"
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-gray-400" />
                <span>{t('issue.email')}</span>
              </label>
              <input
                type="email"
                placeholder="etunimi.sukunimi@edu.xamk.fi"
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Painikkeet */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2d323f]">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#1a1d26] border border-[#2d323f] text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              disabled={isSubmitting}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? t('issue.submitting') : t('issue.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
