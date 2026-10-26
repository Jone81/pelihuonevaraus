import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                {t('issue.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#9da3ae] mt-1">
                {t('issue.desc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {successMessage ? (
          <div className="alert alert-success my-4">
            <span>✅</span>
            <div>
              <strong>{successMessage}</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                {t('issue.successDetail')}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            {errorMessage && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="issue-target">{t('issue.target')} *</Label>
              <select
                id="issue-target"
                className="flex h-11 w-full rounded-xl border border-border bg-[#15181e] px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbba18]"
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

            <div className="space-y-1.5">
              <Label htmlFor="issue-title">{t('issue.reportTitle')} *</Label>
              <Input
                id="issue-title"
                type="text"
                placeholder={t('issue.reportTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issue-desc">{t('issue.reportDesc')} *</Label>
              <textarea
                id="issue-desc"
                className="flex min-h-[90px] w-full rounded-xl border border-border bg-[#15181e] px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbba18]"
                placeholder={t('issue.reportDescPlaceholder')}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="issue-name">{t('issue.reporterName')}</Label>
                <Input
                  id="issue-name"
                  type="text"
                  placeholder={t('issue.reporterNamePlaceholder')}
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="issue-email">{t('issue.reporterEmail')}</Label>
                <Input
                  id="issue-email"
                  type="email"
                  placeholder={t('issue.reporterEmailPlaceholder')}
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                className="btn-touch"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="xamk"
                className="btn-touch"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common.submitting') : t('issue.submitBtn')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
