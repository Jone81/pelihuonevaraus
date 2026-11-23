/**
 * @file AdminSettingsView.tsx
 * @description Ylläpitopaneelin "Sivuston asetukset" / "Site settings" -näkymä.
 * Sisältää aukioloajat, ennakkovarausrajan, yksittäisvarauskiintiön, opiskelijan
 * tilavarauksen, vähimmäiskeston, SharedTV-lukon, oletusarvojen palautuksen sekä
 * Discord Webhook -integraation ja yhteystestauksen.
 */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Clock,
  Calendar,
  Gamepad2,
  Building2,
  Tv,
  RotateCcw,
} from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DiscordIcon } from '@/components/ui/discord-icon';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { UpdateSiteSettingsRequest } from '../../types';

/**
 * AdminSettingsView-komponentin ominaisuudet.
 */
export interface AdminSettingsViewProps {
  /** Callback onnistumisviestin näyttämiseen */
  onStatus: (msg: string | null) => void;
  /** Callback virheviestin näyttämiseen */
  onError: (msg: string | null) => void;
}

/**
 * Sivuston asetusten, varauskiintiöiden ja Discord Webhookin hallintanäkymä.
 */
export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  onStatus,
  onError,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const [discordWebhookUrlDraft, setDiscordWebhookUrl] = useState<string | null>(null);
  const [openTimeHourDraft, setOpenTimeHourDraft] = useState<number | null>(null);
  const [closeTimeHourDraft, setCloseTimeHourDraft] = useState<number | null>(null);
  const [onlyWeekdaysDraft, setOnlyWeekdaysDraft] = useState<boolean | null>(null);
  const [maxAdvanceMonthsDraft, setMaxAdvanceMonthsDraft] = useState<number | null>(null);
  const [maxIndividualHoursDraft, setMaxIndividualHoursDraft] = useState<number | null>(null);
  const [maxStudentRoomHoursDraft, setMaxStudentRoomHoursDraft] = useState<number | null>(null);
  const [minReservationMinutesDraft, setMinReservationMinutesDraft] = useState<number | null>(null);
  const [enforceSharedTvLockDraft, setEnforceSharedTvLockDraft] = useState<boolean | null>(null);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    enabled: isAdmin,
  });

  const discordWebhookUrl = discordWebhookUrlDraft ?? settings?.discordWebhookUrl ?? '';
  const openTimeHour = openTimeHourDraft ?? settings?.openTimeHour ?? 8;
  const closeTimeHour = closeTimeHourDraft ?? settings?.closeTimeHour ?? 18;
  const onlyWeekdays = onlyWeekdaysDraft ?? settings?.onlyWeekdays ?? true;
  const maxAdvanceBookingMonths = maxAdvanceMonthsDraft ?? settings?.maxAdvanceBookingMonths ?? 2;
  const maxIndividualHours = maxIndividualHoursDraft ?? settings?.maxIndividualHours ?? 4;
  const maxStudentRoomHours = maxStudentRoomHoursDraft ?? settings?.maxStudentRoomHours ?? 4;
  const minReservationMinutes = minReservationMinutesDraft ?? settings?.minReservationMinutes ?? 30;
  const enforceSharedTvLock = enforceSharedTvLockDraft ?? settings?.enforceSharedTvLock ?? true;

  // Päivitä sivustoasetukset ja varauskiintiöt
  const updateSettingsMutation = useMutation({
    mutationFn: (req: UpdateSiteSettingsRequest) => api.updateSettings(req, user?.id ?? ''),
    onSuccess: () => {
      onStatus(
        isEn
          ? 'Site settings, booking quotas, and room policies saved.'
          : 'Sivuston asetukset, varauskiintiöt ja tilasäännöt tallennettu.'
      );
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to save settings.'
          : 'Asetusten tallennus epäonnistui.'
      );
    },
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onStatus(null);
    onError(null);
    setTestWebhookStatus(null);

    if (closeTimeHour <= openTimeHour) {
      onError(
        isEn
          ? 'Closing hour must be after opening hour.'
          : 'Sulkemiskellonajan on oltava avaamiskellonajan jälkeen.'
      );
      return;
    }

    updateSettingsMutation.mutate({
      discordWebhookUrl: discordWebhookUrl.trim(),
      openTimeHour,
      closeTimeHour,
      onlyWeekdays,
      maxAdvanceBookingMonths,
      maxIndividualHours,
      maxStudentRoomHours,
      minReservationMinutes,
      enforceSharedTvLock,
      isMaintenanceMode: settings?.isMaintenanceMode ?? false,
      maintenanceMessage: settings?.maintenanceMessage ?? '',
    });
  };

  const handleResetDefaultQuotas = () => {
    setOpenTimeHourDraft(8);
    setCloseTimeHourDraft(18);
    setOnlyWeekdaysDraft(true);
    setMaxAdvanceMonthsDraft(2);
    setMaxIndividualHoursDraft(4);
    setMaxStudentRoomHoursDraft(4);
    setMinReservationMinutesDraft(30);
    setEnforceSharedTvLockDraft(true);
    onStatus(null);
    onError(null);

    updateSettingsMutation.mutate({
      discordWebhookUrl: discordWebhookUrl.trim(),
      openTimeHour: 8,
      closeTimeHour: 18,
      onlyWeekdays: true,
      maxAdvanceBookingMonths: 2,
      maxIndividualHours: 4,
      maxStudentRoomHours: 4,
      minReservationMinutes: 30,
      enforceSharedTvLock: true,
      isMaintenanceMode: settings?.isMaintenanceMode ?? false,
      maintenanceMessage: settings?.maintenanceMessage ?? '',
    });
  };

  const handleTestWebhook = async () => {
    const trimmed = discordWebhookUrl.trim();
    if (!trimmed) {
      setTestWebhookStatus(
        isEn ? 'Enter a webhook URL first.' : 'Syötä ensin Discord Webhook URL.'
      );
      return;
    }
    setTestWebhookStatus(
      isEn ? 'Sending test notification...' : 'Lähetetään testi-ilmoitusta...'
    );
    try {
      const res = await fetch(trimmed, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Xamk Game Room testi-ilmoitus. Discord Webhook -yhteys toimii.',
        }),
      });
      if (res.ok || res.status === 204) {
        setTestWebhookStatus(
          isEn ? 'Test notification sent to Discord.' : 'Testi-ilmoitus lähetetty Discordiin.'
        );
      } else {
        setTestWebhookStatus(
          isEn
            ? `Discord returned status ${res.status}.`
            : `Discord palautti tilakoodin ${res.status}.`
        );
      }
    } catch {
      setTestWebhookStatus(
        isEn
          ? 'Connection to Discord failed. Check the URL.'
          : 'Yhteydenotto Discordiin epäonnistui. Tarkista URL.'
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* VARAUSKIINTIÖT JA TILASÄÄNNÖT */}
      <Card className="lg:col-span-7">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Settings className="w-5 h-5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
            <span>
              {isEn ? 'Active booking quotas and room policy' : 'Voimassa olevat varauskiintiöt ja tilasäännöt'}
            </span>
          </CardTitle>
          <div className="w-12 h-1 bg-[#FACC15] my-1" />
          <CardDescription>
            {isEn
              ? 'Configure opening hours, advance limits, booking quotas, and console TV locking enforced by the backend.'
              : 'Muokkaa varausjärjestelmän palvelimen valvomia aukiolo-, kiintiö- ja laitesääntöjä.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveSettings} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Aukioloajat */}
            <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#1C1F24] border border-[#3F444E] text-[#FACC15] shrink-0"
                    aria-hidden="true"
                  >
                    <Clock className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                      {isEn ? 'Opening hours' : 'Aukioloajat'}
                    </div>
                    <div className="font-mono text-xs text-[#9CA3AF]">
                      {`${String(openTimeHour).padStart(2, '0')}:00-${String(closeTimeHour).padStart(2, '0')}:00, ${
                        onlyWeekdays ? (isEn ? 'Mon-Fri' : 'ma-pe') : isEn ? 'Mon-Sun' : 'ma-su'
                      }`}
                    </div>
                  </div>
                </div>
                <Badge variant="status">
                  {onlyWeekdays ? (isEn ? 'MON-FRI' : 'MA-PE') : isEn ? 'MON-SUN' : 'MA-SU'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="open-hour-select" className="text-xs">
                    {isEn ? 'Opens' : 'Avaus'}
                  </Label>
                  <NativeSelect
                    id="open-hour-select"
                    wrapperClassName="min-h-[36px]"
                    value={String(openTimeHour)}
                    onChange={(e) => {
                      setOpenTimeHourDraft(Number(e.target.value));
                      onStatus(null);
                    }}
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((h) => (
                      <option key={h} value={h}>
                        {`${String(h).padStart(2, '0')}:00`}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div>
                  <Label htmlFor="close-hour-select" className="text-xs">
                    {isEn ? 'Closes' : 'Sulku'}
                  </Label>
                  <NativeSelect
                    id="close-hour-select"
                    wrapperClassName="min-h-[36px]"
                    value={String(closeTimeHour)}
                    onChange={(e) => {
                      setCloseTimeHourDraft(Number(e.target.value));
                      onStatus(null);
                    }}
                  >
                    {[14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((h) => (
                      <option key={h} value={h}>
                        {`${String(h).padStart(2, '0')}:00`}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div>
                <Label htmlFor="weekdays-select" className="text-xs">
                  {isEn ? 'Open days' : 'Aukiolopäivät'}
                </Label>
                <NativeSelect
                  id="weekdays-select"
                  wrapperClassName="min-h-[36px]"
                  value={onlyWeekdays ? 'weekdays' : 'all'}
                  onChange={(e) => {
                    setOnlyWeekdaysDraft(e.target.value === 'weekdays');
                    onStatus(null);
                  }}
                >
                  <option value="weekdays">
                    {isEn ? 'Weekdays only, Mon-Fri' : 'Vain arkipäivät, ma-pe'}
                  </option>
                  <option value="all">
                    {isEn ? 'Every day, Mon-Sun' : 'Kaikki viikonpäivät, ma-su'}
                  </option>
                </NativeSelect>
              </div>
            </div>

            {/* 2. Ennakkovarausraja */}
            <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#1C1F24] border border-[#3F444E] text-[#FACC15] shrink-0"
                    aria-hidden="true"
                  >
                    <Calendar className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                      {isEn ? 'Advance window' : 'Ennakkovarausraja'}
                    </div>
                    <div className="font-mono text-xs text-[#9CA3AF]">
                      {isEn
                        ? `Up to ${maxAdvanceBookingMonths} months`
                        : `Korkeintaan ${maxAdvanceBookingMonths} kuukautta`}
                    </div>
                  </div>
                </div>
                <Badge variant="status">{`${maxAdvanceBookingMonths} ${isEn ? 'MO' : 'KK'}`}</Badge>
              </div>

              <div>
                <Label htmlFor="advance-months-select" className="text-xs">
                  {isEn ? 'Allowed advance window' : 'Sallittu ennakkovarausaika'}
                </Label>
                <NativeSelect
                  id="advance-months-select"
                  wrapperClassName="min-h-[36px]"
                  value={String(maxAdvanceBookingMonths)}
                  onChange={(e) => {
                    setMaxAdvanceMonthsDraft(Number(e.target.value));
                    onStatus(null);
                  }}
                >
                  {[1, 2, 3, 4, 6, 12].map((m) => (
                    <option key={m} value={m}>
                      {isEn ? `${m} months in advance` : `${m} kuukautta etukäteen`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* 3. Yksittäisvaraus ja päiväkiintiö */}
            <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#1C1F24] border border-[#3F444E] text-[#FACC15] shrink-0"
                    aria-hidden="true"
                  >
                    <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                      {isEn ? 'Single station quota' : 'Yksittäisvaraus'}
                    </div>
                    <div className="font-mono text-xs text-[#9CA3AF]">
                      {maxIndividualHours} {isEn ? 'hours per day' : 'tuntia päivässä'}
                    </div>
                  </div>
                </div>
                <Badge variant="status">{`${maxIndividualHours} H`}</Badge>
              </div>

              <div>
                <Label htmlFor="individual-hours-select" className="text-xs">
                  {isEn ? 'Daily quota per student' : 'Opiskelijan päiväkiintiö ja enimmäiskesto'}
                </Label>
                <NativeSelect
                  id="individual-hours-select"
                  wrapperClassName="min-h-[36px]"
                  value={String(maxIndividualHours)}
                  onChange={(e) => {
                    setMaxIndividualHoursDraft(Number(e.target.value));
                    onStatus(null);
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((h) => (
                    <option key={h} value={h}>
                      {isEn ? `Up to ${h} hours per day` : `Enintään ${h} tuntia päivässä`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* 4. Opiskelijan tilavaraus */}
            <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#1C1F24] border border-[#3F444E] text-[#FACC15] shrink-0"
                    aria-hidden="true"
                  >
                    <Building2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                      {isEn ? 'Student room booking' : 'Opiskelijan tilavaraus'}
                    </div>
                    <div className="font-mono text-xs text-[#9CA3AF]">
                      {isEn
                        ? `Up to ${maxStudentRoomHours} hours`
                        : `Enintään ${maxStudentRoomHours} tuntia`}
                    </div>
                  </div>
                </div>
                <Badge variant="status">{`${maxStudentRoomHours} H`}</Badge>
              </div>

              <div>
                <Label htmlFor="room-hours-select" className="text-xs">
                  {isEn ? 'Room booking duration limit' : 'Tilavarauksen enimmäiskesto opiskelijalle'}
                </Label>
                <NativeSelect
                  id="room-hours-select"
                  wrapperClassName="min-h-[36px]"
                  value={String(maxStudentRoomHours)}
                  onChange={(e) => {
                    setMaxStudentRoomHoursDraft(Number(e.target.value));
                    onStatus(null);
                  }}
                >
                  {[1, 2, 3, 4, 6, 8, 10].map((h) => (
                    <option key={h} value={h}>
                      {isEn ? `Up to ${h} hours` : `Enintään ${h} tuntia`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* 5. Varauksen vähimmäiskesto */}
            <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#1C1F24] border border-[#3F444E] text-[#FACC15] shrink-0"
                    aria-hidden="true"
                  >
                    <Clock className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                      {isEn ? 'Minimum duration' : 'Vähimmäisvaraus'}
                    </div>
                    <div className="font-mono text-xs text-[#9CA3AF]">
                      {isEn
                        ? `At least ${minReservationMinutes} minutes`
                        : `Vähintään ${minReservationMinutes} minuuttia`}
                    </div>
                  </div>
                </div>
                <Badge variant="status">{`${minReservationMinutes} MIN`}</Badge>
              </div>

              <div>
                <Label htmlFor="min-duration-select" className="text-xs">
                  {isEn ? 'Shortest allowed slot' : 'Lyhin sallittu varausjakso'}
                </Label>
                <NativeSelect
                  id="min-duration-select"
                  wrapperClassName="min-h-[36px]"
                  value={String(minReservationMinutes)}
                  onChange={(e) => {
                    setMinReservationMinutesDraft(Number(e.target.value));
                    onStatus(null);
                  }}
                >
                  <option value="30">{isEn ? '30 minutes' : '30 minuuttia'}</option>
                  <option value="60">{isEn ? '60 minutes, 1 hour' : '60 minuuttia, 1 tunti'}</option>
                  <option value="120">{isEn ? '120 minutes, 2 hours' : '120 minuuttia, 2 tuntia'}</option>
                </NativeSelect>
              </div>
            </div>

            {/* 6. Konsolien SharedTV-rinnakkaislukko */}
            <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#1C1F24] border border-[#3F444E] text-[#FACC15] shrink-0"
                    aria-hidden="true"
                  >
                    <Tv className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                      {isEn ? 'SharedTV console lock' : 'Konsolien yhteinen TV'}
                    </div>
                    <div className="font-mono text-xs text-[#9CA3AF]">
                      {enforceSharedTvLock
                        ? isEn
                          ? 'PS5 and Switch lock each other'
                          : 'PS5 ja Switch lukitsevat toisensa'
                        : isEn
                        ? 'Simultaneous console booking allowed'
                        : 'Rinnakkaisvaraus sallittu'}
                    </div>
                  </div>
                </div>
                <Badge variant={enforceSharedTvLock ? 'status' : 'installed'}>
                  {enforceSharedTvLock ? (isEn ? 'LOCKED' : 'LUKITTU') : isEn ? 'FREE' : 'VAPAA'}
                </Badge>
              </div>

              <div>
                <Label htmlFor="shared-tv-select" className="text-xs">
                  {isEn ? 'SharedTV policy, Rule #8' : 'Yhteisen television sääntö, Sääntö #8'}
                </Label>
                <NativeSelect
                  id="shared-tv-select"
                  wrapperClassName="min-h-[36px]"
                  value={enforceSharedTvLock ? 'enabled' : 'disabled'}
                  onChange={(e) => {
                    setEnforceSharedTvLockDraft(e.target.value === 'enabled');
                    onStatus(null);
                  }}
                >
                  <option value="enabled">
                    {isEn
                      ? 'Enforced, PS5 and Switch share 1 TV'
                      : 'Voimassa, PS5 ja Switch jakavat saman TV:n'}
                  </option>
                  <option value="disabled">
                    {isEn
                      ? 'Disabled, allow both consoles simultaneously'
                      : 'Pois käytöstä, salli molemmat konsolit yhtä aikaa'}
                  </option>
                </NativeSelect>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 flex-wrap mt-2">
            <Button
              type="submit"
              variant="pill"
              disabled={updateSettingsMutation.isPending}
            >
              <span>
                {updateSettingsMutation.isPending
                  ? isEn
                    ? 'Saving...'
                    : 'Tallennetaan...'
                  : isEn
                  ? 'Save quotas and room policy'
                  : 'Tallenna kiintiöt ja tilasäännöt'}
              </span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleResetDefaultQuotas}
              disabled={updateSettingsMutation.isPending}
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Restore defaults' : 'Palauta oletusarvot'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* OIKEA SARAKE: DISCORD WEBHOOK */}
      <Card className="lg:col-span-5">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <DiscordIcon className="w-5 h-5 shrink-0 text-[#5865F2]" />
            <span>
              {isEn ? 'Discord Webhook integration' : 'Discord Webhook ja automaatti-ilmoitukset'}
            </span>
          </CardTitle>
          <div className="w-12 h-1 bg-[#FACC15] my-1" />
          <CardDescription>
            {isEn
              ? 'When an administrator schedules an official tournament or event, the system automatically posts an announcement to your Discord server.'
              : 'Kun ylläpitäjä luo uuden tapahtuman tai turnauksen pelihuoneeseen, järjestelmä lähettää automaattisen ilmoituksen Discord-kanavallesi.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveSettings} noValidate className="flex flex-col gap-4">
          {testWebhookStatus && (
            <div
              className="rounded-none bg-[#3B82F6]/15 border-2 border-[#3B82F6] shadow-[4px_4px_0px_#000000] px-4 py-3 font-mono text-sm font-bold text-[#93C5FD]"
              role="alert"
            >
              <span>{testWebhookStatus}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="webhook-url">Discord Webhook URL</Label>
            <Input
              id="webhook-url"
              type="text"
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhookUrl}
              onChange={(e) => {
                setDiscordWebhookUrl(e.target.value);
                onStatus(null);
                onError(null);
                setTestWebhookStatus(null);
              }}
            />
            <span className="text-xs text-[#9CA3AF] leading-snug">
              {isEn
                ? 'Create a webhook in your Discord channel settings under Integrations and Webhooks, and paste the URL above.'
                : 'Luo webhook Discord-palvelimesi kanavan asetuksista kohdasta Integrations ja Webhooks, ja liitä URL-osoite tähän.'}
            </span>
          </div>

          <div className="flex gap-2.5 flex-wrap">
            <Button
              type="submit"
              variant="pill"
              disabled={updateSettingsMutation.isPending}
            >
              <span>
                {updateSettingsMutation.isPending
                  ? isEn
                    ? 'Saving...'
                    : 'Tallennetaan...'
                  : isEn
                  ? 'Save Webhook'
                  : 'Tallenna Webhook'}
              </span>
            </Button>

            {discordWebhookUrl.trim() && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestWebhook}
                disabled={updateSettingsMutation.isPending}
                title={isEn ? 'Send test notification' : 'Lähetä testi-ilmoitus kanavalle'}
              >
                <DiscordIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'Test Webhook' : 'Testaa yhteys'}</span>
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};
