/**
 * @file SuperAdminPanel.tsx
 * @description Pääkäyttäjän (SuperAdmin) tapahtumajyräysnäkymä (Sääntö #10).
 * Mahdollistaa virallisen oppilaitostapahtuman luomisen, joka lukitsee koko pelitilan
 * valitulle aikavälille ja peruuttaa automaattisesti päällekkäiset opiskelijavaraukset.
 */
import React, { useState, useId } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Settings,
  Trophy,
  AlertTriangle,
  ClipboardList,
  Calendar,
  Clock,
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from '../router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { OverrideReservationRequest } from '../types';

/**
 * SuperAdmin-jyräyspaneelikomponentti.
 */
export const SuperAdminPanel: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const { setActiveTab } = useRouter();
  const queryClient = useQueryClient();
  const formInstanceId = useId();

  // Lomakekenttien ja vahvistusmodaalin tilat
  const [today] = useState(() => new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(today);
  const [startHour, setStartHour] = useState('10:00');
  const [endHour, setEndHour] = useState('16:00');
  const [reason, setReason] = useState('Virallinen opintojakson eSports-turnaus');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const startDateTime = new Date(`${date}T${startHour}:00`);
  const endDateTime = new Date(`${date}T${endHour}:00`);

  // Mutaatio tapahtumajyräyksen suorittamiseen palvelimella
  const overrideMutation = useMutation({
    mutationFn: (req: OverrideReservationRequest) => api.overrideReservation(req),
    onSuccess: (createdEvent) => {
      setIsConfirmModalOpen(false);
      setErrorMessage(null);
      setStatusMessage(
        isEn
          ? `Official event created, ID ${createdEvent.id.slice(0, 8)}. All overlapping bookings were overridden.`
          : `Tapahtuma luotu, tunniste ${createdEvent.id.slice(0, 8)}. Kaikki päällekkäiset varaukset peruutettiin.`
      );
      // Päivitetään kaikki varauslistat ja saatavuustiedot välimuistista
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    },
    onError: (err: unknown) => {
      setIsConfirmModalOpen(false);
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(isEn ? 'Override operation failed.' : 'Jyräysoperaatio epäonnistui.');
      }
    },
  });

  // Varmistetaan, että vain SuperAdmin pääsee käsiksi näkymään
  if (!isSuperAdmin) {
    return (
      <div className="alert alert-error">
        {isEn
          ? 'Only SuperAdmin accounts have access to this panel.'
          : 'Vain pääkäyttäjällä, SuperAdmin, on pääsy tähän paneeliin.'}
      </div>
    );
  }

  /**
   * Tarkistaa syötetyt ajat ja perustelun sekä avaa vahvistusmodaalin.
   */
  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!user) return;

    if (endDateTime <= startDateTime) {
      setErrorMessage(
        isEn ? 'End time must be after start time.' : 'Loppuajan on oltava alkuajan jälkeen.'
      );
      return;
    }

    if (!reason.trim()) {
      setErrorMessage(
        isEn ? 'Override reason is required.' : 'Perustelu jyräykselle on pakollinen.'
      );
      return;
    }

    setIsConfirmModalOpen(true);
  };

  /**
   * Lähettää vahvistetun tapahtumajyräyspyynnön backendille.
   */
  const executeOverride = () => {
    if (!user) return;
    const request: OverrideReservationRequest = {
      reservationRequest: {
        idempotencyKey: `override-${Date.now()}-${formInstanceId}`,
        userId: user.id,
        reservationType: 3, // Event
        gamingStationId: null,
        startUtc: startDateTime.toISOString(),
        endUtc: endDateTime.toISOString(),
      },
      reason: reason.trim(),
    };
    overrideMutation.mutate(request);
  };

  return (
    <div className="xamk-admin-page">
      {/* Header Row with Switcher */}
      {/* Ylätunniste ja pikavaihtaja tavallisen Admin-paneelin ja SuperAdmin-näkymän välillä */}
      <div className="xamk-admin-header">
        <div className="xamk-admin-header-titles">
          <div className="xamk-admin-kicker">XAMK GAME ROOM, SUPERADMIN AUTHORITY</div>
          <h2 className="xamk-section-heading inline-flex items-center gap-2" style={{ textAlign: 'left' }}>
            <Zap className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{isEn ? 'SuperAdmin, official event override' : 'SuperAdmin, tapahtumajyräys'}</span>
          </h2>
          <div className="xamk-section-underline" style={{ margin: '10px 0 12px' }} />
          <p className="xamk-admin-subtitle">
            {isEn
              ? 'Rule #10. SuperAdmin has authority to schedule official university events and override overlapping student reservations for that time slot.'
              : 'Sääntö #10. SuperAdminilla on oikeus järjestää oppilaitoksen virallinen tapahtuma ja jyrätä yksittäisten opiskelijoiden varaukset kyseiseltä ajankohdalta.'}
          </p>
        </div>

        <div className="xamk-admin-mode-switcher">
          <Button
            type="button"
            variant="station"
            onClick={() => setActiveTab('admin')}
          >
            <div className="xamk-station-card-left">
              <span className="xamk-station-card-icon" aria-hidden="true">
                <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
              </span>
              <span className="xamk-station-card-name">
                {isEn ? 'Admin control panel' : 'Ylläpitopaneeli'}
              </span>
            </div>
            <Badge variant="status">ADMIN</Badge>
          </Button>
          <Button
            type="button"
            variant="station"
            className="xamk-station-card-selected"
            onClick={() => setActiveTab('superadmin')}
          >
            <div className="xamk-station-card-left">
              <span className="xamk-station-card-icon" aria-hidden="true">
                <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
              </span>
              <span className="xamk-station-card-name">
                {isEn ? 'SuperAdmin, event override' : 'SuperAdmin, tapahtumajyräys'}
              </span>
            </div>
            <Badge variant="status">ACTIVE</Badge>
          </Button>
        </div>
      </div>

      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

      <div className="xamk-admin-2col">
        {/* Left Column: Override Form */}
        {/* Vasen sarake: Tapahtuma-ajan ja jyräysperusteen syöttölomake */}
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <Trophy className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{isEn ? 'Create official event and override slot' : 'Aseta tapahtuma-aika ja jyräysperuste'}</span>
            </CardTitle>
            <div className="xamk-modal-underline" />
            <CardDescription>
              {isEn
                ? 'Select the date, start and end hours, and provide the official reason that will be recorded in the audit log.'
                : 'Valitse päivämäärä, alkamis- ja päättymisaika sekä virallinen perustelu, joka tallentuu peruutettavien varausten lokitietoihin.'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleOpenConfirm} className="xamk-modal-form">
            <div className="xamk-field-group">
              <Label htmlFor="admin-date">
                {isEn ? 'Event date *' : 'Tapahtuman päivämäärä *'}
              </Label>
              <div className="xamk-input-box xamk-date-box">
                <input
                  id="admin-date"
                  type="date"
                  className="xamk-date-native-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="xamk-form-row-2col">
              <div className="xamk-field-group">
                <Label htmlFor="admin-start">
                  {isEn ? 'Start time 08:00-17:00 *' : 'Alkamisaika klo 08:00-17:00 *'}
                </Label>
                <NativeSelect
                  id="admin-start"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                >
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </NativeSelect>
              </div>

              <div className="xamk-field-group">
                <Label htmlFor="admin-end">
                  {isEn ? 'End time 09:00-18:00 *' : 'Päättymisaika klo 09:00-18:00 *'}
                </Label>
                <NativeSelect
                  id="admin-end"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                >
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </NativeSelect>
              </div>
            </div>

            <div className="xamk-field-group">
              <Label htmlFor="override-reason">
                {isEn ? 'Official event title and override reason *' : 'Jyräyksen ja tapahtuman perustelu *'}
              </Label>
              <Input
                id="override-reason"
                type="text"
                placeholder={
                  isEn
                    ? 'For example university tournament or visitor day'
                    : 'Esimerkiksi koulun peliturnaus tai vierailijapäivä'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <span className="xamk-field-hint">
                {isEn
                  ? 'This reason is stored on cancelled reservations and displayed on the public schedule.'
                  : 'Tämä viesti tallentuu peruttujen varausten syyksi ja näkyy päivän aikataulussa.'}
              </span>
            </div>

            <div className="xamk-submit-row">
              <Button
                type="submit"
                variant="pill"
                disabled={overrideMutation.isPending}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {overrideMutation.isPending
                    ? isEn
                      ? 'Executing override...'
                      : 'Käsitellään jyräystä...'
                    : isEn
                    ? 'Override bookings and create event'
                    : 'Jyrää varaukset ja luo tapahtuma'}
                </span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Column: Override Summary & Impact Preview */}
        {/* Oikea sarake: Yhteenveto valitusta aikaikkunasta ja jyräyksen vaikutuksista */}
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <ClipboardList className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{isEn ? 'Override operation summary' : 'Jyräysoperaation esikatselu ja vaikutukset'}</span>
            </CardTitle>
            <div className="xamk-modal-underline" />
            <CardDescription>
              {isEn
                ? 'Verify the selected window and check how Rule #10 affects active reservations.'
                : 'Tarkista valittu aikaikkuna ja mitä säännön #10 mukainen tapahtumajyräys tekee päällekkäisille varauksille.'}
            </CardDescription>
          </CardHeader>

          <div className="xamk-stations-2col-grid" style={{ marginBottom: '18px' }}>
            <div className="xamk-station-row-card xamk-station-card-selected" style={{ cursor: 'default' }}>
              <div className="xamk-station-card-left">
                <span className="xamk-station-card-icon" aria-hidden="true">
                  <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                </span>
                <div>
                  <div className="xamk-station-card-name">
                    {new Date(`${date}T12:00:00`).toLocaleDateString('fi-FI', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="xamk-table-subtext">
                    {isEn ? 'Target date' : 'Kohdepäivämäärä'}
                  </div>
                </div>
              </div>
              <Badge variant="status">DATE</Badge>
            </div>

            <div className="xamk-station-row-card xamk-station-card-selected" style={{ cursor: 'default' }}>
              <div className="xamk-station-card-left">
                <span className="xamk-station-card-icon" aria-hidden="true">
                  <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                </span>
                <div>
                  <div className="xamk-station-card-name">
                    {startHour}-{endHour}
                  </div>
                  <div className="xamk-table-subtext">
                    {isEn ? 'Locked window' : 'Lukittava aikaväli'}
                  </div>
                </div>
              </div>
              <Badge variant="status">EVENT</Badge>
            </div>
          </div>

          <div className="xamk-landing-rules-card">
            <h4 className="xamk-landing-rules-heading inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isEn ? 'What happens when you confirm' : 'Mitä jyräyksen vahvistaminen tekee'}</span>
            </h4>
            <ul className="xamk-landing-rules-list">
              <li>
                {isEn
                  ? 'All overlapping single-station and student room bookings in the selected window are automatically cancelled.'
                  : 'Kaikki valitulle aikavälille osuvat yksittäis- ja opiskelijatilavaraukset peruutetaan automaattisesti.'}
              </li>
              <li>
                {isEn
                  ? 'The entire Xamk Game Room, 6 PCs, PS5, and Switch, is locked for the official event.'
                  : 'Koko Xamk Game Room, 6 PC-konetta, PS5 ja Switch, lukitaan virallisen tapahtuman käyttöön.'}
              </li>
              <li>
                {isEn
                  ? 'If a Discord Webhook is configured in settings, an event notification is sent automatically.'
                  : 'Jos Discord Webhook on määritetty asetuksissa, tapahtumasta lähtee ilmoitus Discordiin.'}
              </li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog Modal */}
      {/* Vahvistusmodaali ennen peruuttamattoman jyräyksen suorittamista */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="xamk-modal-md">
          <DialogHeader>
            <div className="xamk-modal-header-row">
              <div className="xamk-modal-icon-badge" aria-hidden="true">
                <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
              </div>
              <div className="xamk-modal-title-group">
                <DialogTitle>
                  {isEn ? 'Confirm SuperAdmin event override' : 'Vahvista tapahtumajyräys'}
                </DialogTitle>
                <div className="xamk-modal-underline" />
                <DialogDescription>
                  {isEn
                    ? 'This action automatically cancels all overlapping reservations made by other users during the selected time window.'
                    : 'Tämä toiminto peruuttaa automaattisesti kaikki samalle aikavälille osuvat muiden käyttäjien varaukset.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="xamk-landing-rules-card" style={{ marginTop: '4px' }}>
            <div className="xamk-table-primary-cell" style={{ gap: '6px' }}>
              <div>
                <strong>{isEn ? 'Date and time:' : 'Ajankohta:'}</strong> {date} klo {startHour}-{endHour}
              </div>
              <div>
                <strong>{isEn ? 'Reason and event:' : 'Perustelu ja tapahtuma:'}</strong> {reason}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={overrideMutation.isPending}
            >
              {isEn ? 'Cancel' : 'Peruuta'}
            </Button>
            <Button
              type="button"
              variant="pill"
              onClick={executeOverride}
              disabled={overrideMutation.isPending}
            >
              <span>
                {overrideMutation.isPending
                  ? isEn
                    ? 'Processing...'
                    : 'Suoritetaan...'
                  : isEn
                  ? 'Confirm override'
                  : 'Vahvista jyräys'}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
