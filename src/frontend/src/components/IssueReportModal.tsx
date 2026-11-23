/**
 * @file IssueReportModal.tsx
 * @description Vikailmoituslomakkeen sisältävä modaali-ikkuna.
 * Mahdollistaa laitevikojen, verkkohäiriöiden tai tilan puutteiden raportoimisen
 * suoraan ylläpidolle.
 */
import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';

/**
 * IssueReportModal-komponentin ominaisuudet (props).
 */
interface IssueReportModalProps {
  /** Onko vikailmoitusmodaali avoinna */
  isOpen: boolean;
  /** Funktio modaalin sulkemiseen */
  onClose: () => void;
}

/**
 * Modaali-ikkuna laite- tai tilavikojen ilmoittamiseen.
 */
export const IssueReportModal: React.FC<IssueReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  // Muodostetaan valittavissa olevat laite- ja tilakohteet valitulla kielellä
  const targetOptions = useMemo(
    () => [
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
    ],
    [t]
  );

  // Lomakekenttien tilat (esitäytetään kirjautuneen käyttäjän tiedoilla, jos saatavilla)
  const [target, setTarget] = useState('PC 1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState(user?.displayName || '');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');

  // Lähetyksen ja palauteviestien tilat
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Käsittelee vikailmoituslomakkeen lähetyksen palvelimelle.
   */
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

      // Näytetään onnistumisviesti ja suljetaan modaali automaattisesti pienen viiveen jälkeen
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
            ? 'Failed to send issue report. Try again.'
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
          <div className="flex items-start gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[2px_2px_0px_#000000]"
              aria-hidden="true"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <DialogTitle className="font-extrabold uppercase tracking-tight text-[#F4F4F5]">
                {t('issue.title')}
              </DialogTitle>
              <div className="h-1 w-12 bg-[#FACC15]" />
              <DialogDescription className="text-sm text-[#A1A1AA]">
                {t('issue.desc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {successMessage ? (
          <div className="rounded-none bg-[#121417] border-2 border-[#22C55E] shadow-[4px_4px_0px_#000000] p-4 text-[#F4F4F5] flex items-start gap-2.5">
            <CheckCircle2
              className="w-5 h-5 shrink-0 mt-0.5 text-[#22C55E]"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <div>
              <strong className="font-mono font-bold text-[#22C55E]">{successMessage}</strong>
              <p className="mt-1 text-sm text-[#F4F4F5]">{t('issue.successDetail')}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="rounded-none bg-[#121417] border-2 border-[#EF4444] shadow-[4px_4px_0px_#000000] p-3 text-sm font-mono font-bold text-[#EF4444] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="issue-target"
                className="text-[#F4F4F5] font-mono font-bold uppercase text-xs tracking-wider"
              >
                {t('issue.target')} *
              </Label>
              <NativeSelect
                id="issue-target"
                className="rounded-none bg-white text-[#09090B]"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              >
                {targetOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="issue-title"
                className="text-[#F4F4F5] font-mono font-bold uppercase text-xs tracking-wider"
              >
                {t('issue.reportTitle')} *
              </Label>
              <Input
                id="issue-title"
                type="text"
                className="rounded-none bg-white text-[#09090B]"
                placeholder={t('issue.reportTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="issue-desc"
                className="text-[#F4F4F5] font-mono font-bold uppercase text-xs tracking-wider"
              >
                {t('issue.reportDesc')} *
              </Label>
              <Textarea
                id="issue-desc"
                className="rounded-none bg-white text-[#09090B]"
                placeholder={t('issue.reportDescPlaceholder')}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="issue-name"
                  className="text-[#F4F4F5] font-mono font-bold uppercase text-xs tracking-wider"
                >
                  {t('issue.reporterName')}
                </Label>
                <Input
                  id="issue-name"
                  type="text"
                  className="rounded-none bg-white text-[#09090B]"
                  placeholder={t('issue.reporterNamePlaceholder')}
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="issue-email"
                  className="text-[#F4F4F5] font-mono font-bold uppercase text-xs tracking-wider"
                >
                  {t('issue.reporterEmail')}
                </Label>
                <Input
                  id="issue-email"
                  type="email"
                  className="rounded-none bg-white text-[#09090B]"
                  placeholder={t('issue.reporterEmailPlaceholder')}
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="pill"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? t('common.submitting') : t('issue.submitBtn')}</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
