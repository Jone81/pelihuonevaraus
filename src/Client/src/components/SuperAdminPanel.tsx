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
      <div className="rounded-none border-2 border-black bg-[#EF4444] text-white px-4 py-3 text-sm font-mono font-bold shadow-[4px_4px_0px_#000000]">
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
    <div className="space-y-6 text-[#F4F4F5]">
      {/* Header Row with Switcher */}
      {/* Ylätunniste ja pikavaihtaja tavallisen Admin-paneelin ja SuperAdmin-näkymän välillä */}
      <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#FACC15]">XAMK GAME ROOM, SUPERADMIN AUTHORITY</div>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#F4F4F5] inline-flex items-center gap-2 text-left">
            <Zap className="w-5 h-5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
            <span>{isEn ? 'SuperAdmin, official event override' : 'SuperAdmin, tapahtumajyräys'}</span>
          </h2>
          <div className="h-1 w-16 bg-[#FACC15]" />
          <p className="text-sm text-[#A1A1AA]">
            {isEn
              ? 'Rule #10. SuperAdmin has authority to schedule official university events and override overlapping student reservations for that time slot.'
              : 'Sääntö #10. SuperAdminilla on oikeus järjestää oppilaitoksen virallinen tapahtuma ja jyrätä yksittäisten opiskelijoiden varaukset kyseiseltä ajankohdalta.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 min-w-[260px]">
          <Button
            type="button"
            variant="station"
            className="w-full justify-between rounded-none bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] px-4 py-3 h-auto"
            onClick={() => setActiveTab('admin')}
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shrink-0" aria-hidden="true">
                <Settings className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="font-mono font-bold text-xs uppercase text-left">
                {isEn ? 'Admin control panel' : 'Ylläpitopaneeli'}
              </span>
            </div>
            <Badge variant="status">ADMIN</Badge>
          </Button>
          <Button
            type="button"
            variant="station"
            className="w-full justify-between rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-[#FACC15] shadow-[3px_3px_0px_#FACC15] px-4 py-3 h-auto"
            onClick={() => setActiveTab('superadmin')}
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#FACC15] text-[#09090B] border border-black shrink-0" aria-hidden="true">
                <Zap className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="font-mono font-bold text-xs uppercase text-left">
                {isEn ? 'SuperAdmin, event override' : 'SuperAdmin, tapahtumajyräys'}
              </span>
            </div>
            <Badge variant="status">ACTIVE</Badge>
          </Button>
        </div>
      </div>

      {statusMessage && <div className="rounded-none border-2 border-black bg-[#22C55E] text-[#09090B] px-4 py-3 text-sm font-mono font-bold shadow-[4px_4px_0px_#000000]">{statusMessage}</div>}
      {errorMessage && <div className="rounded-none border-2 border-black bg-[#EF4444] text-white px-4 py-3 text-sm font-mono font-bold shadow-[4px_4px_0px_#000000]">{errorMessage}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Override Form */}
        {/* Vasen sarake: Tapahtuma-ajan ja jyräysperusteen syöttölomake */}
        <Card className="rounded-none bg-white text-[#09090B] border-2 border-black shadow-[5px_5px_0px_#FACC15] p-6 space-y-5">
          <CardHeader className="p-0 space-y-2">
            <CardTitle className="inline-flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-[#09090B]">
              <Trophy className="w-5 h-5 shrink-0 text-[#09090B]" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Create official event and override slot' : 'Aseta tapahtuma-aika ja jyräysperuste'}</span>
            </CardTitle>
            <div className="h-1 w-12 bg-[#FACC15]" />
            <CardDescription className="text-sm text-[#3F444E]">
              {isEn
                ? 'Select the date, start and end hours, and provide the official reason that will be recorded in the audit log.'
                : 'Valitse päivämäärä, alkamis- ja päättymisaika sekä virallinen perustelu, joka tallentuu peruutettavien varausten lokitietoihin.'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleOpenConfirm} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-date" className="text-[#09090B] font-mono font-bold uppercase text-xs">
                {isEn ? 'Event date *' : 'Tapahtuman päivämäärä *'}
              </Label>
              <div className="w-full">
                <input
                  id="admin-date"
                  type="date"
                  className="w-full px-3 py-2 text-sm rounded-none bg-white text-[#09090B] font-mono border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-start" className="text-[#09090B] font-mono font-bold uppercase text-xs">
                  {isEn ? 'Start time 08:00-17:00 *' : 'Alkamisaika klo 08:00-17:00 *'}
                </Label>
                <NativeSelect
                  id="admin-start"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="rounded-none bg-white text-[#09090B] font-mono border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
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

              <div className="space-y-1.5">
                <Label htmlFor="admin-end" className="text-[#09090B] font-mono font-bold uppercase text-xs">
                  {isEn ? 'End time 09:00-18:00 *' : 'Päättymisaika klo 09:00-18:00 *'}
                </Label>
                <NativeSelect
                  id="admin-end"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="rounded-none bg-white text-[#09090B] font-mono border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
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

            <div className="space-y-1.5">
              <Label htmlFor="override-reason" className="text-[#09090B] font-mono font-bold uppercase text-xs">
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
                className="rounded-none bg-white text-[#09090B] font-mono border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
                required
              />
              <span className="block text-xs text-[#3F444E]">
                {isEn
                  ? 'This reason is stored on cancelled reservations and displayed on the public schedule.'
                  : 'Tämä viesti tallentuu peruttujen varausten syyksi ja näkyy päivän aikataulussa.'}
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="pill"
                disabled={overrideMutation.isPending}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
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
        <Card className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 space-y-5">
          <CardHeader className="p-0 space-y-2">
            <CardTitle className="inline-flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-[#F4F4F5]">
              <ClipboardList className="w-5 h-5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Override operation summary' : 'Jyräysoperaation esikatselu ja vaikutukset'}</span>
            </CardTitle>
            <div className="h-1 w-12 bg-[#FACC15]" />
            <CardDescription className="text-sm text-[#A1A1AA]">
              {isEn
                ? 'Verify the selected window and check how Rule #10 affects active reservations.'
                : 'Tarkista valittu aikaikkuna ja mitä säännön #10 mukainen tapahtumajyräys tekee päällekkäisille varauksille.'}
            </CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-[#FACC15] shadow-[3px_3px_0px_#000000] p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#FACC15] text-[#09090B] border border-black shrink-0" aria-hidden="true">
                  <Calendar className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div>
                  <div className="font-mono font-bold text-sm text-[#F4F4F5]">
                    {new Date(`${date}T12:00:00`).toLocaleDateString('fi-FI', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs font-mono text-[#A1A1AA]">
                    {isEn ? 'Target date' : 'Kohdepäivämäärä'}
                  </div>
                </div>
              </div>
              <Badge variant="status">DATE</Badge>
            </div>

            <div className="rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-[#FACC15] shadow-[3px_3px_0px_#000000] p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#FACC15] text-[#09090B] border border-black shrink-0" aria-hidden="true">
                  <Clock className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div>
                  <div className="font-mono font-bold text-sm text-[#F4F4F5]">
                    {startHour}-{endHour}
                  </div>
                  <div className="text-xs font-mono text-[#A1A1AA]">
                    {isEn ? 'Locked window' : 'Lukittava aikaväli'}
                  </div>
                </div>
              </div>
              <Badge variant="status">EVENT</Badge>
            </div>
          </div>

          <div className="rounded-none bg-[#121417] border border-[#3F444E] p-4 space-y-3">
            <h4 className="text-sm font-extrabold uppercase tracking-tight text-[#FACC15] inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'What happens when you confirm' : 'Mitä jyräyksen vahvistaminen tekee'}</span>
            </h4>
            <ul className="space-y-2 text-sm text-[#D4D4D8] list-disc pl-5 marker:text-[#FACC15]">
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
        <DialogContent className="max-w-lg rounded-none bg-white text-[#09090B] border-2 border-black shadow-[5px_5px_0px_#FACC15]">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-none bg-[#EF4444] text-white border-2 border-black" aria-hidden="true">
                <AlertTriangle className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-extrabold uppercase tracking-tight text-[#09090B]">
                  {isEn ? 'Confirm SuperAdmin event override' : 'Vahvista tapahtumajyräys'}
                </DialogTitle>
                <div className="h-1 w-12 bg-[#EF4444]" />
                <DialogDescription className="text-sm text-[#3F444E]">
                  {isEn
                    ? 'This action automatically cancels all overlapping reservations made by other users during the selected time window.'
                    : 'Tämä toiminto peruuttaa automaattisesti kaikki samalle aikavälille osuvat muiden käyttäjien varaukset.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="rounded-none bg-[#F4F4F5] text-[#09090B] border-2 border-black p-4 text-sm font-mono mt-1">
            <div className="flex flex-col gap-1.5">
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
