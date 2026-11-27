/**
 * @file RealtimeStatus.tsx
 * @description Pelihuoneen reaaliaikainen tilannetaulu (Live Status) ja päiväkohtainen laitekatsaus.
 * Näyttää päivämäärävalintapalkin suoraan 8 pelipistekortin yläpuolella. Kuluvalle päivälle
 * kortit näyttävät sekä nykyhetken (seuraavan tunnin) tilanteen että päivän kaikki varaukset;
 * muille päiville korttien reunavärit ja tilabadget päivittyvät suoraan valitun päivän
 * varaustilanteen mukaan.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Monitor,
  Gamepad2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  Tv,
  Building2,
  Map,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import type { GamingStation } from '../types';

/**
 * RealtimeStatus-komponentin ominaisuudet (props).
 */
interface RealtimeStatusProps {
  /** Valinnainen funktio pohjakuvamodaalin avaamiseen */
  onOpenFloorPlan?: () => void;
  /** Valinnainen funktio, jolla siirrytään suoraan varausnäkymään valitulla ajalla/laitteella */
  onNavigateToBooking?: (stationId?: string, startHour?: string, endHour?: string) => void;
}

/**
 * Muotoilee ISO-aikaleiman paikalliseksi kellonajaksi `HH:MM`.
 */
function formatLocalTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Palauttaa päivämäärän merkkijonona muodossa `YYYY-MM-DD` paikallisessa ajassa.
 */
function toLocalDateInputString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Reaaliaikaisen tilanteen ja päiväkohtaisen pelipistenäkymän komponentti.
 */
export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ onOpenFloorPlan }) => {
  const { t, lang } = useLanguage();
  const isEn = lang === 'en';

  const todayDate = new Date();
  const todayStr = toLocalDateInputString(todayDate);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = toLocalDateInputString(tomorrowDate);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isToday = selectedDate === todayStr;
  const isTomorrow = selectedDate === tomorrowStr;

  // Haetaan kaikki tilan pelipisteet
  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  // Haetaan reaaliaikainen tilanne kuluvalle tunnille
  const {
    data: availableStations,
    isLoading: loadingAvailable,
    refetch: refetchAvailable,
  } = useQuery({
    queryKey: ['available-now'],
    queryFn: () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      return api.getAvailableStations(now.toISOString(), oneHourLater.toISOString());
    },
    refetchInterval: 30000,
  });

  // Haetaan kuluvan tunnin aktiiviset varaukset mahdollisten käynnissä olevien tilavarausten tunnistamiseksi
  const { data: activeReservations, refetch: refetchActiveNow } = useQuery({
    queryKey: ['active-reservations-now'],
    queryFn: () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      return api.getActiveReservations(now.toISOString(), oneHourLater.toISOString());
    },
    refetchInterval: 30000,
  });

  // Haetaan valitun päivän kaikki varaukset laitekohtaista päiväyhteenvetoa varten
  const startDayUtc = new Date(`${selectedDate}T00:00:00`).toISOString();
  const endDayUtc = new Date(`${selectedDate}T23:59:59`).toISOString();
  const {
    data: dayReservations,
    isLoading: loadingDayReservations,
    refetch: refetchDay,
  } = useQuery({
    queryKey: ['reservations-day', selectedDate],
    queryFn: () => api.getActiveReservations(startDayUtc, endDayUtc),
    refetchInterval: 30000,
  });

  // Päivämäärän navigaatiokäsittelijät
  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 1);
    setSelectedDate(toLocalDateInputString(d));
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + 1);
    setSelectedDate(toLocalDateInputString(d));
  };

  const handleSetToday = () => {
    setSelectedDate(todayStr);
  };

  const handleSetTomorrow = () => {
    setSelectedDate(tomorrowStr);
  };

  const handleRefreshAll = () => {
    void refetchAvailable();
    void refetchActiveNow();
    void refetchDay();
  };

  // Muotoillaan viikonpäivä + päivämäärä -otsikko
  const formattedDateTitle = (() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(isEn ? 'en-GB' : 'fi-FI', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  })();

  // Tarkistetaan onko koko tila varattu juuri nyt (vain kun tarkastellaan tätä päivää)
  const activeRoomReservation = isToday
    ? activeReservations?.find(
        (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
      )
    : undefined;

  // Valitun päivän koko tilan tai tapahtuman varaukset
  const dayRoomReservations = (dayReservations ?? []).filter(
    (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
  );

  const availableIds = new Set(availableStations?.map((s) => s.id) ?? []);

  // Tarkistetaan SharedTV-lukon tilanne kuluvalle hetkelle (näytetään vain kun isToday)
  const ps5 = stations?.find((s) => s.type === 'PlayStation5');
  const switchSt = stations?.find((s) => s.type === 'NintendoSwitch');

  const ps5Available = ps5 ? availableIds.has(ps5.id) : false;
  const switchAvailable = switchSt ? availableIds.has(switchSt.id) : false;

  const isSharedTvInUse = Boolean(isToday && ps5 && switchSt && (!ps5Available || !switchAvailable));

  /**
   * Apufunktio laitekohtaisten päivävarausten (suorat varaukset, tilavaraukset, SharedTV-lukot) hakemiseen.
   */
  const getStationBookingsSummary = (station: GamingStation) => {
    if (!dayReservations || dayReservations.length === 0) return null;

    const direct = dayReservations.filter((r) => r.gamingStationId === station.id);
    const room = dayReservations.filter(
      (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
    );
    const tvConflict = station.usesSharedTv
      ? dayReservations.filter(
          (r) =>
            r.gamingStationId &&
            r.gamingStationId !== station.id &&
            stations?.find((s) => s.id === r.gamingStationId)?.usesSharedTv
        )
      : [];

    return {
      direct: direct.map((r) => ({
        time: `${formatLocalTime(r.startUtc)}-${formatLocalTime(r.endUtc)}`,
        booker: r.bookerName || (isEn ? 'Student' : 'Opiskelija'),
      })),
      room: room.map((r) => ({
        time: `${formatLocalTime(r.startUtc)}-${formatLocalTime(r.endUtc)}`,
        type: r.reservationType,
        booker: r.bookerName || (isEn ? 'Room reserved' : 'Tila varattu'),
      })),
      tvLocked: tvConflict.map((r) => ({
        time: `${formatLocalTime(r.startUtc)}-${formatLocalTime(r.endUtc)}`,
      })),
    };
  };

  const isLoading = loadingStations || (isToday ? loadingAvailable : loadingDayReservations);

  return (
    <div className="space-y-6">
      {/* Otsikkorivi ja pikapainikkeet */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b-2 border-[#3F444E] pb-4">
        <div>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#F4F4F5]">
            {t('status.title')}
          </h2>
          <p className="text-sm text-[#A1A1AA] mt-1">{t('status.desc')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {onOpenFloorPlan && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-[44px] rounded-none font-mono font-bold flex items-center gap-1.5"
              onClick={onOpenFloorPlan}
            >
              <Map className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{t('booking.openFloorPlan')}</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] rounded-none font-mono font-bold flex items-center gap-1.5"
            onClick={handleRefreshAll}
          >
            <RefreshCw className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span>{t('status.refresh')}</span>
          </Button>
        </div>
      </div>

      {/* Päivämäärävalintapalkki suoraan 8 pelipistekortin yläpuolella */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3.5 rounded-none bg-[#1C1F24] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] rounded-none font-mono font-bold text-xs uppercase bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] transition-colors cursor-pointer"
            onClick={handlePrevDay}
            aria-label={t('schedule.prevDay')}
          >
            <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden sm:inline">{t('schedule.prevDay')}</span>
          </button>

          <div className="relative flex-1 sm:flex-none">
            <label htmlFor="status-date-input" className="sr-only">
              {t('schedule.dateLabel')}
            </label>
            <div className="relative flex items-center">
              <span
                className="pointer-events-none absolute left-3 text-[#09090B] inline-flex items-center"
                aria-hidden="true"
              >
                <Calendar className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <input
                id="status-date-input"
                type="date"
                className="w-full sm:w-auto pl-9 pr-3 py-2 min-h-[42px] rounded-none bg-white text-[#09090B] font-mono font-bold text-sm border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] rounded-none font-mono font-bold text-xs uppercase bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] transition-colors cursor-pointer"
            onClick={handleNextDay}
            aria-label={t('schedule.nextDay')}
          >
            <span className="hidden sm:inline">{t('schedule.nextDay')}</span>
            <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-none font-mono font-bold text-xs uppercase border transition-colors cursor-pointer ${
              isToday
                ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                : 'bg-[#121417] text-[#F4F4F5] border-[#3F444E] hover:bg-[#FACC15] hover:text-[#09090B] hover:border-black'
            }`}
            onClick={handleSetToday}
          >
            {t('schedule.today')}
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-none font-mono font-bold text-xs uppercase border transition-colors cursor-pointer ${
              isTomorrow
                ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                : 'bg-[#121417] text-[#F4F4F5] border-[#3F444E] hover:bg-[#FACC15] hover:text-[#09090B] hover:border-black'
            }`}
            onClick={handleSetTomorrow}
          >
            {t('schedule.tomorrow')}
          </button>
          <span className="ml-1 font-mono font-bold text-xs sm:text-sm uppercase text-[#FACC15]">
            {formattedDateTitle}
          </span>
        </div>
      </div>

      {/* Käynnissä oleva koko tilan varaus (kun tarkastellaan tätä päivää) */}
      {activeRoomReservation && (
        <div
          className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#EF4444] shadow-[4px_4px_0px_#000000] p-4 text-sm min-w-0 break-words"
          role="alert"
        >
          <strong className="font-mono font-bold text-[#EF4444]">
            {t('status.roomBookedNow')},{' '}
            {activeRoomReservation.reservationType === 'Event'
              ? t('booking.type.event')
              : t('booking.type.room')}
            .
          </strong>{' '}
          {activeRoomReservation.bookerName ? (
            <>
              {t('status.booker')}{' '}
              <strong className="font-mono font-bold text-[#F4F4F5]">
                {activeRoomReservation.bookerName}
              </strong>{' '}
              {activeRoomReservation.bookerEmail && (
                <a
                  href={`mailto:${activeRoomReservation.bookerEmail}`}
                  className="underline font-mono font-bold text-[#FACC15] hover:text-white break-all"
                >
                  ({activeRoomReservation.bookerEmail})
                </a>
              )}
              . {t('booking.contactBooker')}
            </>
          ) : isEn ? (
            'The room is reserved for group use.'
          ) : (
            'Tila on varattu ryhmäkäyttöön.'
          )}
        </div>
      )}

      {/* Valitun päivän koko tilan / tapahtuman varaukset (näytetään jos päivälle osuu tilavarauksia) */}
      {dayRoomReservations.length > 0 && !activeRoomReservation && (
        <div
          className="flex items-start gap-3 p-4 rounded-none bg-[#1C1F24] border-2 border-[#FACC15] text-[#F4F4F5] shadow-[4px_4px_0px_#000000]"
          role="alert"
        >
          <div
            className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#FACC15] text-[#09090B] border border-black shrink-0"
            aria-hidden="true"
          >
            <Building2 className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 space-y-2 text-sm">
            <strong className="font-extrabold uppercase tracking-tight text-[#FACC15]">
              {t('schedule.roomAlert')}.
            </strong>
            <ul className="space-y-1.5 list-none p-0 m-0">
              {dayRoomReservations.map((r) => (
                <li key={r.id} className="font-mono text-xs sm:text-sm text-[#F4F4F5] break-words">
                  <span className="font-bold text-[#FACC15]">
                    {formatLocalTime(r.startUtc)}–{formatLocalTime(r.endUtc)}
                  </span>{' '}
                  —{' '}
                  {r.reservationType === 'Event'
                    ? t('booking.type.event')
                    : t('booking.type.room')}
                  {r.bookerName && (
                    <>
                      {' '}
                      ({t('status.booker')} <strong>{r.bookerName}</strong>
                      {r.bookerEmail && (
                        <>
                          {' '}
                          <a
                            href={`mailto:${r.bookerEmail}`}
                            className="underline font-bold text-[#FACC15] hover:text-white break-all"
                          >
                            {r.bookerEmail}
                          </a>
                        </>
                      )}
                      )
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Konsolikaapin SharedTV-ilmoitus (vain kuluvalle päivälle) */}
      {isSharedTvInUse && (
        <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3B82F6] shadow-[4px_4px_0px_#000000] p-4 text-sm font-mono font-bold">
          {t('status.sharedTvInUse')}
        </div>
      )}

      {/* 8 pelipistekorttia (tänään: live + päivän varaukset; muu päivä: valitun päivän tilanne) */}
      {isLoading ? (
        <div className="rounded-none bg-[#1C1F24] text-[#A1A1AA] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 text-center font-mono font-bold text-sm uppercase tracking-wider">
          {t('booking.checkingAvailable')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations?.map((station) => {
            const isAvailableNow = availableIds.has(station.id);
            const isTvLockedNow = station.usesSharedTv && isSharedTvInUse && !isAvailableNow;
            const summary = getStationBookingsSummary(station);
            const hasDirectOrTvBookings = Boolean(
              summary && (summary.direct.length > 0 || summary.tvLocked.length > 0)
            );
            const hasRoomBookings = Boolean(summary && summary.room.length > 0);
            const hasBookingsOnDay = hasDirectOrTvBookings || hasRoomBookings;

            // Kortin reunaväri: tänään nykyhetken mukaan, muina päivinä valitun päivän mukaan
            const cardBorderClass = isToday
              ? isAvailableNow
                ? 'border-[#22C55E]'
                : 'border-[#EF4444]'
              : hasDirectOrTvBookings
              ? 'border-[#EF4444]'
              : hasRoomBookings
              ? 'border-[#FACC15]'
              : 'border-[#22C55E]';

            // Tilabadgen väri ja teksti
            const statusBadgeClass = isToday
              ? isAvailableNow
                ? 'bg-[#22C55E] text-[#09090B]'
                : 'bg-[#EF4444] text-white'
              : hasDirectOrTvBookings
              ? 'bg-[#EF4444] text-white'
              : hasRoomBookings
              ? 'bg-[#FACC15] text-[#09090B]'
              : 'bg-[#22C55E] text-[#09090B]';

            const statusBadgeLabel = isToday
              ? isAvailableNow
                ? t('status.free')
                : isTvLockedNow
                ? `TV ${t('status.busy')}`
                : t('status.busy')
              : hasDirectOrTvBookings
              ? t('status.busy')
              : hasRoomBookings
              ? t('schedule.roomLocked')
              : t('status.free');

            return (
              <div
                key={station.id}
                className={`rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 shadow-[4px_4px_0px_#000000] p-4 flex flex-col justify-between gap-4 ${cardBorderClass}`}
              >
                {/* Kortin ylärivi: flex-wrap estää pitkien konsolinimien (PlayStation 5, Nintendo Switch) katkeamisen */}
                <div className="flex items-start justify-between gap-2.5 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-[#121417] border-2 border-[#3F444E] text-[#FACC15]"
                      aria-hidden="true"
                    >
                      {station.type === 'PC' ? (
                        <Monitor className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        <Gamepad2 className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-extrabold uppercase tracking-tight text-base text-[#F4F4F5] leading-snug break-words">
                        {station.name}
                      </h3>
                      <span className="block font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA]">
                        {station.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {station.usesSharedTv && (
                      <span className="rounded-none bg-[#3B82F6] text-white border border-black px-2 py-0.5 text-xs font-mono font-bold uppercase inline-flex items-center gap-1">
                        <Tv className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                        <span>{t('booking.sharedTvBadge')}</span>
                      </span>
                    )}
                    <span
                      className={`rounded-none border-2 border-black px-2.5 py-0.5 text-xs font-mono font-bold uppercase ${statusBadgeClass}`}
                    >
                      {statusBadgeLabel}
                    </span>
                  </div>
                </div>

                {/* Valitun päivän varatut ajat tälle pelipisteelle */}
                <div className="pt-3 border-t border-[#3F444E] space-y-2">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                    <Calendar
                      className="w-3.5 h-3.5 shrink-0 text-[#FACC15]"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span>{isToday ? t('schedule.today') : formattedDateTitle}:</span>
                  </div>
                  {hasBookingsOnDay && summary ? (
                    <div className="flex flex-wrap gap-1.5">
                      {summary.direct.map((b, idx) => (
                        <span
                          key={`dir-${idx}`}
                          className="rounded-none bg-[#121417] border border-[#EF4444] text-[#EF4444] px-2 py-0.5 text-xs font-mono font-bold inline-flex items-center gap-1 max-w-full break-words"
                          title={`${t('status.booker')} ${b.booker}`}
                        >
                          <Lock className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          <span className="break-words">
                            {b.time} ({b.booker})
                          </span>
                        </span>
                      ))}
                      {summary.tvLocked.map((tv, idx) => (
                        <span
                          key={`tv-${idx}`}
                          className="rounded-none bg-[#121417] border border-[#3B82F6] text-[#3B82F6] px-2 py-0.5 text-xs font-mono font-bold inline-flex items-center gap-1 max-w-full break-words"
                          title={t('status.sharedTvInUse')}
                        >
                          <Tv className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          <span className="break-words">{tv.time} TV</span>
                        </span>
                      ))}
                      {summary.room.map((rm, idx) => (
                        <span
                          key={`rm-${idx}`}
                          className="rounded-none bg-[#121417] border border-[#FACC15] text-[#FACC15] px-2 py-0.5 text-xs font-mono font-bold inline-flex items-center gap-1 max-w-full break-words"
                          title={`${t('schedule.roomLocked')}: ${rm.booker}`}
                        >
                          <Building2
                            className="w-3 h-3 shrink-0"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                          <span className="break-words">
                            {rm.time} {rm.type}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-bold text-[#22C55E] inline-flex items-center gap-1">
                      <CheckCircle2
                        className="w-3.5 h-3.5 shrink-0"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      <span>{t('schedule.freeAllDay')}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
