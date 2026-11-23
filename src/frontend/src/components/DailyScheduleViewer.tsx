/**
 * @file DailyScheduleViewer.tsx
 * @description Monipuolinen päiväkohtaisen aikataulun tarkastelukomponentti.
 * Tarjoaa kolme esitystapaa:
 * 1) Visuaalinen aikajana (`timeline`) klo 08:00-18:00
 * 2) Pelipistekohtaiset varauskortit (`cards`)
 * 3) Taulukkoyhteenveto kaikista päivän varauksista (`summary`)
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  BarChart3,
  ClipboardList,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  Monitor,
  Gamepad2,
  Tv,
  Lock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import type { GamingStation, Reservation } from '../types';

/**
 * DailyScheduleViewer-komponentin ominaisuudet (props).
 */
export interface DailyScheduleViewerProps {
  /** Tarkasteltava päivämäärä muodossa 'YYYY-MM-DD' */
  selectedDate: string; // 'YYYY-MM-DD'
  /** Valinnainen takaisinkutsu päivämäärän vaihtuessa */
  onDateChange?: (newDate: string) => void;
  /** Valinnainen takaisinkutsu, kun käyttäjä klikkaa vapaata aikaväliä */
  onSelectSlot?: (stationId: string, startHour: string, endHour: string) => void;
  /** Näytetäänkö päivämäärän valintapalkki (oletus `true`) */
  showDateSelector?: boolean;
}

/**
 * Yksittäinen aikavälilohko pelipisteen päiväaikajanalla.
 */
interface TimeInterval {
  /** Alkamisaika minuutteina keskiyöstä (esim. 480 = klo 08:00) */
  startMin: number; // minutes from midnight (e.g. 480 for 08:00)
  /** Päättymisaika minuutteina keskiyöstä (esim. 1080 = klo 18:00) */
  endMin: number;   // minutes from midnight (e.g. 1080 for 18:00)
  /** Alkamisaika merkkijonona (esim. '08:00') */
  startStr: string; // '08:00'
  /** Päättymisaika merkkijonona (esim. '10:00') */
  endStr: string;   // '10:00'
  /** Lohkon tila: vapaa, varattu, yhteisen TV:n lukitsema tai tilavarauksen lukitsema */
  type: 'free' | 'busy' | 'tv-locked' | 'room-locked';
  /** Lohkoon liittyvä varausobjekti (jos varattu) */
  reservation?: Reservation;
  /** Seliteteksti työkaluvihjettä (tooltip) varten */
  title: string;
}

/** Aukioloajan alkaminen minuutteina (klo 08:00 = 480 min) */
const OPEN_MIN = 8 * 60;   // 08:00 = 480 min
/** Aukioloajan päättyminen minuutteina (klo 18:00 = 1080 min) */
const CLOSE_MIN = 18 * 60; // 18:00 = 1080 min
/** Aukioloajan kokonaispituus minuutteina (600 min = 10 tuntia) */
const TOTAL_MIN = CLOSE_MIN - OPEN_MIN; // 600 min

/** Aikajanan tuntiasteikon merkinnät */
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

/**
 * Muuntaa keskiyöstä lasketut minuutit kellonaikamerkkijonoksi `HH:MM`.
 */
function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Jäsentää ISO-aikaleiman paikalliseksi kellonajaksi ja minuuteiksi keskiyöstä.
 */
function parseTimeToMinutes(isoString: string): { totalMinutes: number; timeStr: string } {
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes();
  return {
    totalMinutes: h * 60 + m,
    timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
  };
}

/**
 * Päivän varaustilanteen ja aikajanan esittävä komponentti.
 */
export const DailyScheduleViewer: React.FC<DailyScheduleViewerProps> = ({
  selectedDate,
  onDateChange,
  onSelectSlot,
  showDateSelector = true,
}) => {
  const { t, lang } = useLanguage();
  const isEn = lang === 'en';
  const [viewMode, setViewMode] = useState<'timeline' | 'cards' | 'summary'>('timeline');

  // Haetaan kaikki pelipisteet
  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  // Haetaan valitun päivän varaukset (koko vuorokaudelta)
  const startDayUtc = new Date(`${selectedDate}T00:00:00`).toISOString();
  const endDayUtc = new Date(`${selectedDate}T23:59:59`).toISOString();

  const {
    data: dayReservations,
    isLoading: loadingReservations,
    refetch,
  } = useQuery({
    queryKey: ['reservations-day', selectedDate],
    queryFn: () => api.getActiveReservations(startDayUtc, endDayUtc),
    refetchInterval: 30000,
  });

  // Päivämäärän navigaatio: siirtyy edelliseen päivään
  const handlePrevDay = () => {
    if (!onDateChange) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  // Siirtyy seuraavaan päivään
  const handleNextDay = () => {
    if (!onDateChange) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  // Valitsee kuluvan päivän
  const handleSetToday = () => {
    if (!onDateChange) return;
    const today = new Date().toISOString().split('T')[0];
    onDateChange(today);
  };

  // Valitsee huomisen päivän
  const handleSetTomorrow = () => {
    if (!onDateChange) return;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  // Muotoillaan kaunis päivämääräotsikko
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

  const roomReservations = (dayReservations || []).filter(
    (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
  );

  /**
   * Lasketaan kullekin laitteelle aikajanaintervallit (varatut ja vapaat) klo 08:00-18:00 välille.
   */
  const computeStationIntervals = (station: GamingStation): TimeInterval[] => {
    if (!dayReservations) return [];

    // 1. Tähän pisteeseen suoraan kohdistuvat varaukset
    const directRes = dayReservations.filter((r) => r.gamingStationId === station.id);

    // 2. Koko tilan / tapahtuman varaukset (blokkaavat kaiken)
    const roomRes = dayReservations.filter(
      (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
    );

    // 3. Shared TV -lukko (jos kyseessä konsoli ja toinen konsoli on varattu)
    const tvLockedRes = station.usesSharedTv
      ? dayReservations.filter(
          (r) =>
            r.gamingStationId &&
            r.gamingStationId !== station.id &&
            stations?.find((s) => s.id === r.gamingStationId)?.usesSharedTv
        )
      : [];

    // Kerätään kaikki estot ja leikataan aukioloaikaan (08:00-18:00)
    const blocks: TimeInterval[] = [];

    roomRes.forEach((r) => {
      const { totalMinutes: sMin } = parseTimeToMinutes(r.startUtc);
      const { totalMinutes: eMin } = parseTimeToMinutes(r.endUtc);
      const start = Math.max(OPEN_MIN, Math.min(CLOSE_MIN, sMin));
      const end = Math.max(OPEN_MIN, Math.min(CLOSE_MIN, eMin));
      if (end > start) {
        blocks.push({
          startMin: start,
          endMin: end,
          startStr: minToTimeStr(start),
          endStr: minToTimeStr(end),
          type: 'room-locked',
          reservation: r,
          title: `${t('schedule.roomLocked')}: ${r.bookerName || 'Varattu'} (${minToTimeStr(start)}-${minToTimeStr(end)})`,
        });
      }
    });

    directRes.forEach((r) => {
      const { totalMinutes: sMin } = parseTimeToMinutes(r.startUtc);
      const { totalMinutes: eMin } = parseTimeToMinutes(r.endUtc);
      const start = Math.max(OPEN_MIN, Math.min(CLOSE_MIN, sMin));
      const end = Math.max(OPEN_MIN, Math.min(CLOSE_MIN, eMin));
      if (end > start) {
        blocks.push({
          startMin: start,
          endMin: end,
          startStr: minToTimeStr(start),
          endStr: minToTimeStr(end),
          type: 'busy',
          reservation: r,
          title: `${t('schedule.busy')}: ${r.bookerName || 'Käyttäjä'} (${minToTimeStr(start)}-${minToTimeStr(end)})`,
        });
      }
    });

    tvLockedRes.forEach((r) => {
      const { totalMinutes: sMin } = parseTimeToMinutes(r.startUtc);
      const { totalMinutes: eMin } = parseTimeToMinutes(r.endUtc);
      const start = Math.max(OPEN_MIN, Math.min(CLOSE_MIN, sMin));
      const end = Math.max(OPEN_MIN, Math.min(CLOSE_MIN, eMin));
      if (end > start) {
        blocks.push({
          startMin: start,
          endMin: end,
          startStr: minToTimeStr(start),
          endStr: minToTimeStr(end),
          type: 'tv-locked',
          reservation: r,
          title: `${t('schedule.tvLocked')}: Konsolikaapin TV varattu (${minToTimeStr(start)}-${minToTimeStr(end)})`,
        });
      }
    });

    // Järjestetään estot alkuajan mukaan
    blocks.sort((a, b) => a.startMin - b.startMin);

    // Yhdistetään ja muodostetaan vapaat välit väleihin
    const result: TimeInterval[] = [];
    let currentMin = OPEN_MIN;

    for (const b of blocks) {
      if (b.startMin > currentMin) {
        result.push({
          startMin: currentMin,
          endMin: b.startMin,
          startStr: minToTimeStr(currentMin),
          endStr: minToTimeStr(b.startMin),
          type: 'free',
          title: `${t('schedule.free')} (${minToTimeStr(currentMin)}-${minToTimeStr(b.startMin)})`,
        });
      }
      result.push(b);
      currentMin = Math.max(currentMin, b.endMin);
    }

    if (currentMin < CLOSE_MIN) {
      result.push({
        startMin: currentMin,
        endMin: CLOSE_MIN,
        startStr: minToTimeStr(currentMin),
        endStr: minToTimeStr(CLOSE_MIN),
        type: 'free',
        title: `${t('schedule.free')} (${minToTimeStr(currentMin)}-${minToTimeStr(CLOSE_MIN)})`,
      });
    }

    return result;
  };

  /**
   * Käsittelee vapaan aikavälilohkon klikkauksen ja välittää valitun oletusajan `onSelectSlot`-funktiolle.
   */
  const handleSlotClick = (stationId: string, interval: TimeInterval) => {
    if (interval.type !== 'free' || !onSelectSlot) return;

    // Lasketaan järkevä oletuskesto enintään 4 h yksittäiselle laitteelle
    const slotDurationHours = (interval.endMin - interval.startMin) / 60;
    const chosenDurationHours = Math.min(2, Math.min(4, slotDurationHours));
    const targetEndMin = Math.min(interval.endMin, interval.startMin + chosenDurationHours * 60);

    onSelectSlot(stationId, interval.startStr, minToTimeStr(targetEndMin));
  };

  const totalBookingsCount = dayReservations?.length ?? 0;

  return (
    <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-4 sm:p-6 space-y-5">
      {/* Yläpalkki ja otsikko */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-4 border-b border-[#3F444E]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shrink-0" aria-hidden="true">
              <Calendar className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('schedule.title')}</h3>
            <span className="inline-flex items-center px-2.5 py-1 rounded-none bg-[#121417] text-[#FACC15] border border-[#3F444E] font-mono font-bold text-xs uppercase">
              {totalBookingsCount > 0
                ? `${totalBookingsCount} ${t('schedule.todayBookingsCount')}`
                : t('schedule.noBookingsForDay')}
            </span>
          </div>
          <p className="text-sm text-[#A1A1AA]">{t('schedule.desc')}</p>
        </div>

        {/* Näkymävalitsin (Aikajana / Kortit / Yhteenveto) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-none font-mono font-bold text-xs uppercase transition-colors cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[2px_2px_0px_#000000]'
                : 'bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15]'
            }`}
            onClick={() => setViewMode('timeline')}
            title="Näytä graafinen aikataulumatriisi"
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden sm:inline">{t('schedule.timelineView')}</span>
            <span className="sm:hidden">{isEn ? 'Timeline' : 'Aikataulu'}</span>
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-none font-mono font-bold text-xs uppercase transition-colors cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[2px_2px_0px_#000000]'
                : 'bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15]'
            }`}
            onClick={() => setViewMode('cards')}
            title="Näytä pelipisteiden varauskortit"
          >
            <Monitor className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden sm:inline">{t('schedule.listView')}</span>
            <span className="sm:hidden">{isEn ? 'Stations' : 'Pisteet'}</span>
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-none font-mono font-bold text-xs uppercase transition-colors cursor-pointer ${
              viewMode === 'summary'
                ? 'bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[2px_2px_0px_#000000]'
                : 'bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15]'
            }`}
            onClick={() => setViewMode('summary')}
            title="Kaikki varaukset listana"
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden sm:inline">{t('schedule.summaryView')}</span>
            <span className="sm:hidden">{isEn ? 'List' : 'Lista'}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-none font-mono font-bold text-xs bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] transition-colors cursor-pointer"
            onClick={() => refetch()}
            title={t('status.refresh')}
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Päivämäärän valintapalkki */}
      {showDateSelector && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3.5 rounded-none bg-[#121417] border border-[#3F444E]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] rounded-none font-mono font-bold text-xs uppercase bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] transition-colors cursor-pointer"
              onClick={handlePrevDay}
              aria-label={t('schedule.prevDay')}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden sm:inline">{t('schedule.prevDay')}</span>
            </button>

            <div className="relative flex-1 sm:flex-none">
              <label htmlFor="schedule-date-input" className="sr-only">
                {t('schedule.dateLabel')}
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-[#09090B] inline-flex items-center" aria-hidden="true">
                  <Calendar className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <input
                  id="schedule-date-input"
                  type="date"
                  className="w-full sm:w-auto pl-9 pr-3 py-2 min-h-[42px] rounded-none bg-white text-[#09090B] font-mono font-bold text-sm border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
                  value={selectedDate}
                  onChange={(e) => onDateChange && onDateChange(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] rounded-none font-mono font-bold text-xs uppercase bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] transition-colors cursor-pointer"
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
              className="px-3 py-1.5 rounded-none font-mono font-bold text-xs uppercase bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] hover:bg-[#FACC15] hover:text-[#09090B] hover:border-black transition-colors cursor-pointer"
              onClick={handleSetToday}
            >
              {t('schedule.today')}
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-none font-mono font-bold text-xs uppercase bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] hover:bg-[#FACC15] hover:text-[#09090B] hover:border-black transition-colors cursor-pointer"
              onClick={handleSetTomorrow}
            >
              {t('schedule.tomorrow')}
            </button>
            <span className="ml-1 font-mono font-bold text-xs sm:text-sm uppercase text-[#FACC15]">{formattedDateTitle}</span>
          </div>
        </div>
      )}

      {/* Koko tilan varaukset / Tapahtumat varoitusbanneri */}
      {roomReservations.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-none bg-[#121417] border-2 border-[#3B82F6] text-[#F4F4F5] shadow-[4px_4px_0px_#000000]" role="alert">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#3B82F6] text-white border border-black shrink-0" aria-hidden="true">
            <Building2 className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-2 text-sm">
            <strong className="font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('schedule.roomAlert')}.</strong>
            <ul className="space-y-1.5 list-none p-0 m-0">
              {roomReservations.map((r) => {
                const s = parseTimeToMinutes(r.startUtc).timeStr;
                const e = parseTimeToMinutes(r.endUtc).timeStr;
                return (
                  <li key={r.id} className="text-sm text-[#F4F4F5]">
                    <span className="inline-block px-2 py-0.5 rounded-none bg-[#3B82F6] text-white font-mono font-bold text-xs uppercase border border-black">
                      {r.reservationType === 'Event' ? t('booking.type.event') : t('booking.type.room')}
                    </span>{' '}
                    <strong className="font-mono font-bold text-[#FACC15]">klo {s}-{e}</strong>, {t('booking.booker')}{' '}
                    <strong>{r.bookerName || 'Opiskelija tai Admin'}</strong>{' '}
                    {r.bookerEmail && (
                      <a href={`mailto:${r.bookerEmail}`} className="font-mono text-xs text-[#FACC15] underline hover:text-white">
                        ({r.bookerEmail})
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {loadingStations || loadingReservations ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-[#A1A1AA] font-mono font-bold text-sm">
          <div className="w-8 h-8 border-4 border-[#3F444E] border-t-[#FACC15] rounded-none animate-spin"></div>
          <span>{t('booking.checkingAvailable')}</span>
        </div>
      ) : (
        <>
          {/* Vinkkiteksti klikkaamisesta, jos onSelectSlot on käytössä */}
          {onSelectSlot && (
            <div className="px-3.5 py-2 rounded-none bg-[#121417] border-l-4 border-[#FACC15] text-xs font-mono font-bold text-[#F4F4F5]">
              <span>{t('schedule.clickSlotHint')}</span>
            </div>
          )}

          {/* 1. VISUAALINEN AIKATAULUMATRIISI (TIMELINE VIEW) */}
          {viewMode === 'timeline' && (
            <div className="space-y-3">
              {/* Väriselitteet */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-bold text-[#F4F4F5]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-none bg-[#22C55E] border border-black inline-block"></span> {t('schedule.free')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-none bg-[#EF4444] border border-black inline-block"></span> {t('schedule.busy')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-none bg-[#FACC15] border border-black inline-block"></span> {t('schedule.tvLocked')}
                </span>
                {roomReservations.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-none bg-[#3B82F6] border border-black inline-block"></span> {t('schedule.roomLocked')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 sm:hidden text-[#FACC15] font-mono font-bold text-[11px] uppercase ml-auto">
                  {isEn ? 'Swipe timeline' : 'Pyyhkäise aikajanaa'}
                </span>
              </div>

              <div className="overflow-x-auto border border-[#3F444E] bg-[#121417]">
                {/* Tuntimerkinnät yläreunassa */}
                <div className="flex items-stretch border-b-2 border-[#3F444E] bg-[#1C1F24] min-w-[780px]">
                  <div className="w-44 sm:w-52 shrink-0 px-3 py-2.5 border-r border-[#3F444E] font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA] flex items-center">
                    {t('schedule.station')}
                  </div>
                  <div className="relative flex-1 h-10 mx-5">
                    {HOURS.map((hour, idx) => (
                      <div
                        key={hour}
                        className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center justify-end pb-1 pointer-events-none"
                        style={{ left: `${(idx / (HOURS.length - 1)) * 100}%` }}
                      >
                        <span className="font-mono font-bold text-[11px] text-[#A1A1AA]">{hour}</span>
                        <span className="w-px h-1.5 bg-[#3F444E] mt-0.5"></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jokaisen pelipisteen aikajanarivi */}
                <div className="divide-y divide-[#3F444E] min-w-[780px]">
                  {stations?.map((station) => {
                    const intervals = computeStationIntervals(station);
                    return (
                      <div key={station.id} className="flex items-stretch bg-[#121417] hover:bg-[#1C1F24]/60 transition-colors">
                        {/* Laiteinfo vasemmalla */}
                        <div className="w-44 sm:w-52 shrink-0 px-3 py-2.5 border-r border-[#3F444E] flex items-center gap-2 bg-[#1C1F24]">
                          <span className="text-[#FACC15] shrink-0" aria-hidden="true">
                            {station.type === 'PC' ? (
                              <Monitor className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                            ) : (
                              <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                            )}
                          </span>
                          <span className="font-mono font-bold text-xs text-[#F4F4F5] truncate">{station.name}</span>
                          {station.usesSharedTv && (
                            <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-[#121417] text-[#FACC15] border border-[#3F444E] font-mono font-bold text-[10px] uppercase shrink-0" title="Käyttää yhteistä televisiota">
                              <Tv className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                              <span>TV</span>
                            </span>
                          )}
                        </div>

                        {/* 08:00-18:00 aikajana */}
                        <div className="relative flex-1 h-12 mx-5">
                          {/* Taustan tuntiviivat */}
                          {HOURS.slice(0, -1).map((_, idx) => (
                            <div
                              key={idx}
                              className="absolute top-0 bottom-0 w-px bg-[#3F444E]/50 pointer-events-none"
                              style={{ left: `${(idx / (HOURS.length - 1)) * 100}%` }}
                            />
                          ))}

                          {/* Varaukset ja vapaat lohkot */}
                          {intervals.map((interval, i) => {
                            const left = ((interval.startMin - OPEN_MIN) / TOTAL_MIN) * 100;
                            const width = ((interval.endMin - interval.startMin) / TOTAL_MIN) * 100;

                            if (interval.type === 'free') {
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  className={`absolute top-1.5 bottom-1.5 rounded-none overflow-hidden flex items-center justify-center px-1.5 font-mono font-bold text-[11px] bg-[#1C1F24] text-[#22C55E] border border-[#22C55E]/70 transition-colors ${
                                    onSelectSlot
                                      ? 'cursor-pointer hover:bg-[#22C55E] hover:text-[#09090B] hover:border-black'
                                      : 'cursor-default'
                                  }`}
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={`${station.name}: ${interval.title}${onSelectSlot ? ', ' + t('schedule.clickSlotHint') : ''}`}
                                  onClick={() => handleSlotClick(station.id, interval)}
                                >
                                  <span className="truncate">
                                    {interval.startStr}-{interval.endStr}
                                  </span>
                                </button>
                              );
                            }

                            if (interval.type === 'tv-locked') {
                              return (
                                <div
                                  key={i}
                                  className="absolute top-1.5 bottom-1.5 rounded-none overflow-hidden flex items-center justify-center px-1.5 font-mono font-bold text-[11px] bg-[#121417] text-[#FACC15] border border-[#FACC15] cursor-not-allowed"
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={interval.title}
                                >
                                  <span className="inline-flex items-center gap-1 max-w-full truncate">
                                    <Tv className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                                    <span className="truncate">{interval.startStr}-{interval.endStr}</span>
                                  </span>
                                </div>
                              );
                            }

                            if (interval.type === 'room-locked') {
                              return (
                                <div
                                  key={i}
                                  className="absolute top-1.5 bottom-1.5 rounded-none overflow-hidden flex items-center justify-center px-1.5 font-mono font-bold text-[11px] bg-[#3B82F6] text-white border border-black cursor-not-allowed"
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={interval.title}
                                >
                                  <span className="inline-flex items-center gap-1 max-w-full truncate">
                                    <Building2 className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                                    <span className="truncate">{interval.startStr}-{interval.endStr}</span>
                                  </span>
                                </div>
                              );
                            }

                            // Busy block
                            return (
                              <div
                                key={i}
                                className="absolute top-1.5 bottom-1.5 rounded-none overflow-hidden flex items-center justify-center px-1.5 font-mono font-bold text-[11px] bg-[#EF4444] text-white border border-black cursor-not-allowed"
                                style={{ left: `${left}%`, width: `${width}%` }}
                                title={interval.title}
                              >
                                <span className="inline-flex items-center gap-1 max-w-full truncate">
                                  <Lock className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                                  <span className="truncate">
                                    {interval.startStr}-{interval.endStr}
                                    {interval.reservation?.bookerName ? ` (${interval.reservation.bookerName})` : ''}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. PISTEIDEN KORTIT (LIST / CARDS VIEW) */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {stations?.map((station) => {
                const intervals = computeStationIntervals(station);
                const busyIntervals = intervals.filter((it) => it.type !== 'free');
                const freeIntervals = intervals.filter((it) => it.type === 'free');

                return (
                  <div key={station.id} className="rounded-none bg-[#121417] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] flex flex-col">
                    <div className="flex items-start justify-between gap-2 p-4 border-b border-[#3F444E] bg-[#1C1F24]">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#121417] text-[#FACC15] border border-[#3F444E] shrink-0" aria-hidden="true">
                          {station.type === 'PC' ? (
                            <Monitor className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          ) : (
                            <Gamepad2 className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          )}
                        </span>
                        <div>
                          <h4 className="font-extrabold uppercase tracking-tight text-sm text-[#F4F4F5]">{station.name}</h4>
                          <span className="font-mono font-bold text-xs text-[#A1A1AA] uppercase">{station.type}</span>
                        </div>
                      </div>
                      {station.usesSharedTv && (
                        <span className="px-2 py-0.5 rounded-none bg-[#FACC15] text-[#09090B] border border-black font-mono font-bold text-[10px] uppercase shrink-0">{t('booking.sharedTvBadge')}</span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-3">
                      {busyIntervals.length === 0 ? (
                        <div className="flex flex-col items-start gap-2.5 p-3 rounded-none bg-[#1C1F24] border border-[#22C55E]/60 text-sm text-[#22C55E] font-mono font-bold">
                          <span className="inline-flex items-center text-[#22C55E]" aria-hidden="true">
                            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          </span>
                          <span>{t('schedule.freeAllDay')}</span>
                          {onSelectSlot && (
                            <button
                              type="button"
                              className="mt-1 px-3 py-1.5 rounded-none font-mono font-bold text-xs uppercase bg-[#FACC15] text-[#09090B] border-2 border-black hover:bg-white transition-colors cursor-pointer"
                              onClick={() => onSelectSlot(station.id, '10:00', '12:00')}
                            >
                              {t('schedule.quickSelectSlot')} (10:00-12:00)
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="font-mono font-bold text-xs uppercase text-[#A1A1AA]">{t('booking.upcomingToday')}</div>
                          {busyIntervals.map((b, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-none font-mono font-bold text-xs border ${
                                b.type === 'tv-locked'
                                  ? 'bg-[#1C1F24] text-[#FACC15] border-[#FACC15]'
                                  : b.type === 'room-locked'
                                  ? 'bg-[#3B82F6] text-white border-black'
                                  : 'bg-[#EF4444]/20 text-[#FCA5A5] border-[#EF4444]'
                              }`}
                            >
                              <span className="whitespace-nowrap">
                                {b.startStr}-{b.endStr}
                              </span>
                              <span className="truncate">
                                {b.type === 'tv-locked'
                                  ? t('schedule.tvLocked')
                                  : b.type === 'room-locked'
                                  ? t('schedule.roomLocked')
                                  : b.reservation?.bookerName || t('schedule.busy')}
                              </span>
                            </div>
                          ))}

                          {/* Näytetään myös vapaat ajat */}
                          <div className="pt-2 border-t border-[#3F444E] space-y-1.5">
                            <span className="block font-mono font-bold text-xs uppercase text-[#22C55E]">{t('schedule.free')}:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {freeIntervals.map((f, fIdx) => (
                                <button
                                  key={fIdx}
                                  type="button"
                                  className={`px-2 py-1 rounded-none font-mono font-bold text-xs bg-[#1C1F24] text-[#22C55E] border border-[#22C55E] ${
                                    onSelectSlot
                                      ? 'cursor-pointer hover:bg-[#22C55E] hover:text-[#09090B] hover:border-black transition-colors'
                                      : 'cursor-default'
                                  }`}
                                  onClick={() => handleSlotClick(station.id, f)}
                                  title={onSelectSlot ? t('schedule.clickSlotHint') : undefined}
                                >
                                  {f.startStr}-{f.endStr}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. YHTEENVETO KAIKISTA PÄIVÄN VARAUKSISTA (SUMMARY VIEW) */}
          {viewMode === 'summary' && (
            <div className="overflow-x-auto border border-[#3F444E] bg-[#121417]">
              {(!dayReservations || dayReservations.length === 0) ? (
                <div className="p-8 text-center font-mono font-bold text-sm text-[#A1A1AA]">
                  <p>{t('schedule.noBookingsForDay')}</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#1C1F24] border-b-2 border-[#3F444E]">
                    <tr>
                      <th className="px-4 py-3 font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA]">{t('schedule.time')}</th>
                      <th className="px-4 py-3 font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA]">{t('schedule.station')}</th>
                      <th className="px-4 py-3 font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA]">{t('schedule.type')}</th>
                      <th className="px-4 py-3 font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA]">{t('schedule.bookerInfo')}</th>
                      <th className="px-4 py-3 font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA]">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3F444E]">
                    {dayReservations.map((r) => {
                      const start = parseTimeToMinutes(r.startUtc).timeStr;
                      const end = parseTimeToMinutes(r.endUtc).timeStr;
                      const station = stations?.find((s) => s.id === r.gamingStationId);
                      const targetName =
                        r.reservationType === 'Room' || r.reservationType === 'Event'
                          ? 'Koko tila'
                          : station?.name || 'Pelipiste';

                      return (
                        <tr key={r.id} className="hover:bg-[#1C1F24]/70 transition-colors">
                          <td className="px-4 py-3 align-middle">
                            <strong className="font-mono font-bold text-[#FACC15] whitespace-nowrap">
                              klo {start}-{end}
                            </strong>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span className="font-mono font-bold text-[#F4F4F5]">{targetName}</span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-none font-mono font-bold text-xs uppercase ${
                                r.reservationType === 'Event'
                                  ? 'bg-[#FACC15] text-[#09090B] border border-black'
                                  : r.reservationType === 'Room'
                                  ? 'bg-[#3B82F6] text-white border border-black'
                                  : 'bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E]'
                              }`}
                            >
                              {r.reservationType === 'Event'
                                ? t('booking.type.event')
                                : r.reservationType === 'Room'
                                ? t('booking.type.room')
                                : t('booking.type.individual')}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex flex-col gap-0.5 text-[#F4F4F5]">
                              <strong>{r.bookerName || 'Opiskelija'}</strong>
                              {r.bookerEmail && (
                                <a href={`mailto:${r.bookerEmail}`} className="font-mono text-xs text-[#FACC15] underline hover:text-white">
                                  {r.bookerEmail}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {r.bookerEmail && (
                              <a
                                href={`mailto:${r.bookerEmail}?subject=Pelihuonevaraus klo ${start}-${end}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none font-mono font-bold text-xs uppercase bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] hover:bg-[#FACC15] hover:text-[#09090B] hover:border-black transition-colors whitespace-nowrap"
                              >
                                <MessageSquare className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                                <span>{t('schedule.contactBooker')}</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
