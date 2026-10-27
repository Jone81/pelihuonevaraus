import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import {
  Calendar,
  Clock,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Gamepad2,
  Gamepad,
  Tv,
  Building,
  Lock,
  CheckCircle2,
  Mail,
  ListFilter,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';
import type { GamingStation, Reservation } from '../types';

export interface DailyScheduleViewerProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onDateChange?: (newDate: string) => void;
  onSelectSlot?: (stationId: string, startHour: string, endHour: string) => void;
  showDateSelector?: boolean;
  hideHeaderTitle?: boolean;
  lockViewMode?: 'timeline' | 'cards' | 'summary';
  selectedStationId?: string;
  selectedStartHour?: string;
  selectedEndHour?: string;
}

interface DragSelection {
  stationId: string;
  startMin: number;
  currentMin: number;
  effectiveStartMin: number;
  effectiveEndMin: number;
  pointerId: number;
}

interface TimeInterval {
  startMin: number; // minutes from midnight (e.g. 480 for 08:00)
  endMin: number;   // minutes from midnight (e.g. 1080 for 18:00)
  startStr: string; // '08:00'
  endStr: string;   // '10:00'
  type: 'free' | 'busy' | 'tv-locked' | 'room-locked';
  reservation?: Reservation;
  title: string;
}

const OPEN_MIN = 8 * 60;   // 08:00 = 480 min
const CLOSE_MIN = 18 * 60; // 18:00 = 1080 min
const TOTAL_MIN = CLOSE_MIN - OPEN_MIN; // 600 min

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseTimeToMinutes(isoString: string): { totalMinutes: number; timeStr: string } {
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes();
  return {
    totalMinutes: h * 60 + m,
    timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
  };
}

export const DailyScheduleViewer: React.FC<DailyScheduleViewerProps> = ({
  selectedDate,
  onDateChange,
  onSelectSlot,
  showDateSelector = true,
  hideHeaderTitle = false,
  lockViewMode,
  selectedStationId,
  selectedStartHour,
  selectedEndHour,
}) => {
  const { t, lang } = useLanguage();
  const isEn = lang === 'en';
  const [internalViewMode, setInternalViewMode] = useState<'timeline' | 'cards' | 'summary'>(
    lockViewMode || 'timeline'
  );
  const [dragState, setDragState] = useState<DragSelection | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  const handleOpenCalendar = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          ref.current.showPicker();
        } catch {
          ref.current.focus();
        }
      } else {
        ref.current.focus();
      }
    }
  };

  const viewMode = lockViewMode || internalViewMode;

  // Haetaan kaikki pelipisteet
  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  // Haetaan valitun päivän varaukset
  const startDayUtc = new Date(`${selectedDate}T00:00:00`).toISOString();
  const endDayUtc = new Date(`${selectedDate}T23:59:59`).toISOString();

  const {
    data: dayReservations,
    isLoading: loadingReservations,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['reservations-day', selectedDate],
    queryFn: () => api.getActiveReservations(startDayUtc, endDayUtc),
    refetchInterval: 30000,
  });

  const getStationIcon = (type: string) => {
    if (type === 'PlayStation5') return <Gamepad2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />;
    if (type === 'NintendoSwitch' || type === 'Switch') return <Gamepad className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />;
    return <Monitor className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />;
  };

  // Järjestetään pisteet loogiseen järjestykseen
  const sortedStations = React.useMemo(() => {
    if (!stations) return [];
    const order = ['Nintendo Switch', 'PC 1', 'PC 2', 'PC 3', 'PC 4', 'PC 5', 'PC 6', 'PlayStation 5'];
    return [...stations].sort((a, b) => {
      const idxA = order.indexOf(a.name);
      const idxB = order.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.name.localeCompare(b.name);
    });
  }, [stations]);

  // Päivämäärän navigaatio
  const handlePrevDay = () => {
    if (!onDateChange) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    if (!onDateChange) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    if (!onDateChange) return;
    const today = new Date().toISOString().split('T')[0];
    onDateChange(today);
  };

  const handleSetTomorrow = () => {
    if (!onDateChange) return;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const formattedDateTitle = (() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(isEn ? 'en-GB' : 'fi-FI', {
        weekday: 'short',
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

  // Lasketaan aikajanaintervallit
  const computeStationIntervals = (station: GamingStation): TimeInterval[] => {
    if (!dayReservations) return [];

    const directRes = dayReservations.filter((r) => r.gamingStationId === station.id);
    const roomRes = dayReservations.filter(
      (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
    );
    const tvLockedRes = station.usesSharedTv
      ? dayReservations.filter(
          (r) =>
            r.gamingStationId &&
            r.gamingStationId !== station.id &&
            stations?.find((s) => s.id === r.gamingStationId)?.usesSharedTv
        )
      : [];

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
          title: `${t('schedule.roomLocked')}: ${r.bookerName || 'Varattu'} (${minToTimeStr(start)}–${minToTimeStr(end)})`,
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
          title: `${t('schedule.busy')}: ${r.bookerName || 'Varattu'} (${minToTimeStr(start)}–${minToTimeStr(end)})`,
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
          title: `${t('schedule.tvLocked')}: Shared TV (${minToTimeStr(start)}–${minToTimeStr(end)})`,
        });
      }
    });

    blocks.sort((a, b) => a.startMin - b.startMin);

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
          title: `${t('schedule.free')} (${minToTimeStr(currentMin)}–${minToTimeStr(b.startMin)})`,
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
        title: `${t('schedule.free')} (${minToTimeStr(currentMin)}–${minToTimeStr(CLOSE_MIN)})`,
      });
    }

    return result;
  };

  const getTimeFromClientX = (clientX: number, trackElem: HTMLElement): number => {
    const rect = trackElem.getBoundingClientRect();
    const relX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const rawMin = OPEN_MIN + (relX / rect.width) * TOTAL_MIN;
    // Snap lähimpään 30 minuuttiin
    const snapped = Math.round(rawMin / 30) * 30;
    return Math.max(OPEN_MIN, Math.min(CLOSE_MIN, snapped));
  };

  const clampDragRange = (
    startMin: number,
    targetMin: number,
    intervals: TimeInterval[]
  ): { s: number; e: number } => {
    let s = Math.min(startMin, targetMin);
    let e = Math.max(startMin, targetMin);

    if (e <= s) {
      e = Math.min(CLOSE_MIN, s + 60);
    }

    // Max 4 tuntia (240 min) opiskelijakiintiö
    if (e - s > 240) {
      if (targetMin >= startMin) {
        e = s + 240;
      } else {
        s = e - 240;
      }
    }

    s = Math.max(OPEN_MIN, s);
    e = Math.min(CLOSE_MIN, e);

    // Törmäystarkistus varattuihin aikaväleihin
    const busyIntervals = intervals.filter((inv) => inv.type !== 'free');
    for (const busy of busyIntervals) {
      if (startMin <= busy.startMin && e > busy.startMin) {
        e = busy.startMin;
      }
      if (startMin >= busy.endMin && s < busy.endMin) {
        s = busy.endMin;
      }
    }

    if (e <= s) {
      e = Math.min(CLOSE_MIN, s + 30);
    }

    return { s, e };
  };

  const handleTrackPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    station: GamingStation,
    intervals: TimeInterval[]
  ) => {
    if (!onSelectSlot) return;
    if (e.button !== 0) return;
    const trackElem = e.currentTarget;
    const clickMin = getTimeFromClientX(e.clientX, trackElem);

    const clickedFreeInterval = intervals.find(
      (inv) => inv.type === 'free' && clickMin >= inv.startMin && clickMin < inv.endMin
    );
    if (!clickedFreeInterval) return;

    try {
      trackElem.setPointerCapture(e.pointerId);
    } catch {}

    const defaultEnd = Math.min(clickedFreeInterval.endMin, clickMin + 60);
    const { s, e: finalEnd } = clampDragRange(clickMin, defaultEnd, intervals);

    setDragState({
      stationId: station.id,
      startMin: clickMin,
      currentMin: defaultEnd,
      effectiveStartMin: s,
      effectiveEndMin: finalEnd,
      pointerId: e.pointerId,
    });
  };

  const handleTrackPointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    station: GamingStation,
    intervals: TimeInterval[]
  ) => {
    if (!dragState || dragState.stationId !== station.id || dragState.pointerId !== e.pointerId) return;
    const trackElem = e.currentTarget;
    const currentMin = getTimeFromClientX(e.clientX, trackElem);
    const { s, e: finalEnd } = clampDragRange(dragState.startMin, currentMin, intervals);

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentMin,
            effectiveStartMin: s,
            effectiveEndMin: finalEnd,
          }
        : null
    );
  };

  const handleTrackPointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    station: GamingStation
  ) => {
    if (!dragState || dragState.stationId !== station.id || dragState.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const startStr = minToTimeStr(dragState.effectiveStartMin);
    const endStr = minToTimeStr(dragState.effectiveEndMin);

    onSelectSlot?.(dragState.stationId, startStr, endStr);
    setDragState(null);
  };

  const handleSlotClick = (stationId: string, interval: TimeInterval) => {
    if (interval.type !== 'free' || !onSelectSlot) return;
    const slotDurationHours = (interval.endMin - interval.startMin) / 60;
    const chosenDurationHours = Math.min(2, Math.min(4, slotDurationHours));
    const targetEndMin = Math.min(interval.endMin, interval.startMin + chosenDurationHours * 60);
    onSelectSlot(stationId, interval.startStr, minToTimeStr(targetEndMin));
  };

  const totalBookingsCount = dayReservations?.length ?? 0;

  return (
    <div className="w-full max-w-full flex flex-col gap-3 min-w-0">
      {/* Yläpalkki (otsikko vain jos ei piilotettu) */}
      {!hideHeaderTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#2d323f]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#d89619]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('schedule.title')}</h3>
            <span className="text-[10px] font-semibold text-[#fbba18] bg-[#fbba18]/10 border border-[#fbba18]/30 px-2 py-0.5 rounded-full">
              {totalBookingsCount > 0 ? `${totalBookingsCount} ${isEn ? 'booked' : 'varattua'}` : (isEn ? 'All free' : 'Kaikki vapaana')}
            </span>
          </div>
          <p className="text-xs text-gray-400">{t('schedule.desc')}</p>
        </div>
      )}

      {/* Päivämäärän ja näkymän ohjauspalkki */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#2d323f]">
        {/* Vasen puoli: Päivämäärän navigaatio */}
        {showDateSelector ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              className="p-1.5 rounded-lg bg-[#14161f] border border-[#2d323f] hover:border-[#d89619] text-gray-300 hover:text-white transition-all cursor-pointer"
              onClick={handlePrevDay}
              aria-label={t('schedule.prevDay')}
              title={t('schedule.prevDay')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Päivämäärävalitsin (Chromen natiivi kalenteri-indikaattori oikealla) */}
            <input
              ref={dateInputRef}
              type="date"
              className="h-8 bg-[#14161f] border border-[#2d323f] text-white rounded-lg px-2.5 text-xs outline-none focus:border-[#fbba18] hover:border-[#fbba18]/60 transition-colors cursor-pointer [color-scheme:dark]"
              value={selectedDate}
              onChange={(e) => onDateChange && onDateChange(e.target.value)}
              onClick={() => handleOpenCalendar(dateInputRef)}
            />

            <button
              type="button"
              className="p-1.5 rounded-lg bg-[#14161f] border border-[#2d323f] hover:border-[#d89619] text-gray-300 hover:text-white transition-all cursor-pointer"
              onClick={handleNextDay}
              aria-label={t('schedule.nextDay')}
              title={t('schedule.nextDay')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              className="px-2 py-1 text-[11px] font-semibold rounded-md bg-[#14161f] border border-[#2d323f] hover:border-[#d89619] text-gray-300 hover:text-white cursor-pointer"
              onClick={handleSetToday}
            >
              {t('schedule.today')}
            </button>
            <button
              type="button"
              className="px-2 py-1 text-[11px] font-semibold rounded-md bg-[#14161f] border border-[#2d323f] hover:border-[#d89619] text-gray-300 hover:text-white cursor-pointer"
              onClick={handleSetTomorrow}
            >
              {t('schedule.tomorrow')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            {/* Kalenterikuvake ja päiväys painikkeena (aukaisee kalenterin) */}
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-[#14161f] hover:bg-[#1c1f2b] border border-[#2d323f] hover:border-[#fbba18] transition-all cursor-pointer group"
              onClick={() => handleOpenCalendar(hiddenDateRef)}
              title="Avaa kalenteri ja vaihda päivää"
            >
              <CalendarDays className="w-4 h-4 text-[#d89619] group-hover:text-[#fbba18] transition-colors flex-shrink-0" />
              <span className="text-xs font-bold text-white capitalize group-hover:text-[#fbba18] transition-colors">
                {formattedDateTitle}
              </span>
              <span className="text-[10px] text-gray-400 group-hover:text-gray-300">▼</span>
              <input
                ref={hiddenDateRef}
                type="date"
                className="sr-only"
                value={selectedDate}
                onChange={(e) => onDateChange && onDateChange(e.target.value)}
              />
            </button>
            <span className="text-[10px] font-semibold text-[#fbba18] bg-[#fbba18]/10 border border-[#fbba18]/30 px-2 py-0.5 rounded-full">
              {totalBookingsCount > 0 ? `${totalBookingsCount} ${isEn ? 'booked' : 'varattua'}` : (isEn ? 'All free' : 'Kaikki vapaana')}
            </span>
          </div>
        )}

        {/* Oikea puoli: Näkymävalitsin (jos ei lukittu) ja päivityspainike */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!lockViewMode && (
            <div className="flex items-center p-0.5 bg-[#14161f] border border-[#2d323f] rounded-lg">
              <button
                type="button"
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'timeline'
                    ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setInternalViewMode('timeline')}
              >
                <Clock className="w-3 h-3" />
                <span>{isEn ? 'Timeline' : 'Aikataulu'}</span>
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'cards'
                    ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setInternalViewMode('cards')}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>{isEn ? 'Stations' : 'Pisteet'}</span>
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'summary'
                    ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setInternalViewMode('summary')}
              >
                <ListFilter className="w-3 h-3" />
                <span>{isEn ? 'List' : 'Lista'}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-[#111318] hover:bg-[#1a1d26] border border-[#2d323f] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            onClick={() => refetch()}
            title={t('status.refresh')}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#d89619]' : ''}`} />
            <span>{t('status.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Koko tilan varaukset / Tapahtumat varoitusbanneri */}
      {roomReservations.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5" role="alert">
          <Building className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="flex flex-col gap-1 min-w-0">
            <strong className="font-bold text-white">{t('schedule.roomAlert')}:</strong>
            <ul className="space-y-1">
              {roomReservations.map((r) => {
                const s = parseTimeToMinutes(r.startUtc).timeStr;
                const e = parseTimeToMinutes(r.endUtc).timeStr;
                return (
                  <li key={r.id} className="text-gray-300">
                    <span className="font-bold text-[#fbba18]">
                      {r.reservationType === 'Event' ? t('booking.type.event') : t('booking.type.room')}
                    </span>{' '}
                    <span>klo {s} – {e}</span> • {t('booking.booker')}{' '}
                    <strong className="text-white">{r.bookerName || 'Opiskelija/Admin'}</strong>{' '}
                    {r.bookerEmail && (
                      <a href={`mailto:${r.bookerEmail}`} className="text-amber-400 hover:underline">
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
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
          <div className="w-6 h-6 border-2 border-[#d89619] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">{t('booking.checkingAvailable')}</span>
        </div>
      ) : (
        <>
          {/* 1. VISUAALINEN AIKATAULUMATRIISI */}
          {viewMode === 'timeline' && (
            <div className="flex flex-col gap-2 min-w-0 max-w-full overflow-hidden">
              {/* Väriselitteet */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 px-1 py-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 ring-1 ring-emerald-400" />
                    <span>{t('schedule.free')}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 ring-1 ring-rose-400" />
                    <span>{t('schedule.busy')}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 ring-1 ring-amber-400" />
                    <span>{t('schedule.tvLocked')}</span>
                  </span>
                  {roomReservations.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500/80 ring-1 ring-purple-400" />
                      <span>{t('schedule.roomLocked')}</span>
                    </span>
                  )}
                </div>

                {onSelectSlot && (
                  <span className="hidden sm:inline-block text-[10px] text-gray-400 italic">
                    {t('schedule.clickSlotHint')}
                  </span>
                )}
              </div>

              {/* Vinkki vetämisestä */}
              {onSelectSlot && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#fbba18] font-medium pb-0.5">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#d89619]" />
                  <span>{isEn ? 'Tip: Drag on a station row with mouse or finger to set time' : 'Vinkki: Valitse ja säädä varausaika vetämällä hiirellä tai sormella suoraan aikajanalla'}</span>
                </div>
              )}

              {/* Aikajanan vieritysalue */}
              <div className="timeline-scroll-area border border-[#2d323f] rounded-xl overflow-x-auto bg-[#111318]">
                {/* Tuntimerkinnät */}
                <div className="timeline-header-row flex border-b border-[#2d323f] bg-[#0c0d11]">
                  <div className="timeline-station-col-header w-40 sm:w-44 flex-shrink-0 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-r border-[#2d323f] bg-[#0c0d11] sticky left-0 z-10">
                    {t('schedule.station')}
                  </div>
                  <div className="timeline-hours-track relative flex-1 h-7">
                    {HOURS.map((hour, idx) => (
                      <div
                        key={hour}
                        className="timeline-hour-mark absolute top-0 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${(idx / (HOURS.length - 1)) * 100}%` }}
                      >
                        <span className="text-[10px] font-mono text-gray-400 mt-1">{hour.split(':')[0]}</span>
                        <span className="w-px h-1.5 bg-[#2d323f] mt-0.5" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pelipisterivit */}
                <div className="timeline-rows flex flex-col">
                  {sortedStations.map((station) => {
                    const intervals = computeStationIntervals(station);
                    return (
                      <div key={station.id} className="timeline-row flex border-b border-[#1c1f28] last:border-b-0 h-9 relative">
                        {/* Laiteinfo vasemmalla */}
                        <div className="timeline-station-cell w-40 sm:w-44 flex-shrink-0 px-3 py-1.5 flex items-center gap-2 border-r border-[#2d323f] bg-[#111318] sticky left-0 z-10">
                          {getStationIcon(station.type)}
                          <span className="text-xs font-semibold text-gray-200 truncate">{station.name}</span>
                          {station.usesSharedTv && (
                            <span className="text-[8px] font-bold text-[#d89619] bg-[#d89619]/15 border border-[#d89619]/30 px-1 rounded flex-shrink-0">
                              TV
                            </span>
                          )}
                        </div>

                        {/* Aikajanapalkki (Interaktiivinen: Klikkaa tai vedä hiirellä / sormella) */}
                        <div
                          className={`timeline-track relative flex-1 h-full overflow-hidden select-none ${
                            onSelectSlot ? 'cursor-col-resize' : ''
                          }`}
                          style={{ touchAction: onSelectSlot ? 'none' : 'auto' }}
                          onPointerDown={(e) => handleTrackPointerDown(e, station, intervals)}
                          onPointerMove={(e) => handleTrackPointerMove(e, station, intervals)}
                          onPointerUp={(e) => handleTrackPointerUp(e, station)}
                          onPointerCancel={() => setDragState(null)}
                        >
                          {/* Ruudukkoviivat */}
                          {HOURS.slice(0, -1).map((_, idx) => (
                            <div
                              key={idx}
                              className="absolute top-0 bottom-0 w-px bg-[#1a1d26] pointer-events-none"
                              style={{ left: `${(idx / (HOURS.length - 1)) * 100}%` }}
                            />
                          ))}

                          {/* Aikablokit */}
                          {intervals.map((interval, i) => {
                            const left = ((interval.startMin - OPEN_MIN) / TOTAL_MIN) * 100;
                            const width = ((interval.endMin - interval.startMin) / TOTAL_MIN) * 100;

                            if (interval.type === 'free') {
                              return (
                                <div
                                  key={i}
                                  className={`absolute top-1 bottom-1 rounded-md text-[10px] font-mono font-medium flex items-center justify-center transition-all overflow-hidden pointer-events-none ${
                                    onSelectSlot
                                      ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-xs'
                                      : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                                  }`}
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={`${station.name}: ${interval.title}`}
                                >
                                  <span className="truncate px-1">
                                    {interval.startStr}–{interval.endStr}
                                  </span>
                                </div>
                              );
                            }

                            if (interval.type === 'tv-locked') {
                              return (
                                <div
                                  key={i}
                                  className="absolute top-1 bottom-1 rounded-md text-[10px] font-mono font-medium flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-300 overflow-hidden pointer-events-none"
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={interval.title}
                                >
                                  <span className="truncate px-1 flex items-center gap-1">
                                    <Tv className="w-2.5 h-2.5 flex-shrink-0" />
                                    <span>{interval.startStr}–{interval.endStr}</span>
                                  </span>
                                </div>
                              );
                            }

                            if (interval.type === 'room-locked') {
                              return (
                                <div
                                  key={i}
                                  className="absolute top-1 bottom-1 rounded-md text-[10px] font-mono font-medium flex items-center justify-center bg-purple-500/15 border border-purple-500/30 text-purple-300 overflow-hidden pointer-events-none"
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={interval.title}
                                >
                                  <span className="truncate px-1 flex items-center gap-1">
                                    <Building className="w-2.5 h-2.5 flex-shrink-0" />
                                    <span>{interval.startStr}–{interval.endStr}</span>
                                  </span>
                                </div>
                              );
                            }

                            // Busy block
                            return (
                              <div
                                key={i}
                                className="absolute top-1 bottom-1 rounded-md text-[10px] font-mono font-medium flex items-center justify-center bg-rose-500/15 border border-rose-500/30 text-rose-300 overflow-hidden pointer-events-none"
                                style={{ left: `${left}%`, width: `${width}%` }}
                                title={interval.title}
                              >
                                <span className="truncate px-1 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span>{interval.startStr}–{interval.endStr}</span>
                                </span>
                              </div>
                            );
                          })}

                          {/* Aktiivinen vetoele tai lomakkeella valittu aikablokki */}
                          {dragState && dragState.stationId === station.id ? (
                            <div
                              className="absolute top-0.5 bottom-0.5 z-30 rounded-md bg-[#fbba18]/30 border-2 border-[#fbba18] text-[#fbba18] font-mono text-[10px] font-black flex items-center justify-center shadow-[0_0_15px_rgba(251,186,24,0.5)] pointer-events-none select-none"
                              style={{
                                left: `${((dragState.effectiveStartMin - OPEN_MIN) / TOTAL_MIN) * 100}%`,
                                width: `${((dragState.effectiveEndMin - dragState.effectiveStartMin) / TOTAL_MIN) * 100}%`,
                              }}
                            >
                              <span className="truncate px-1.5 py-0.5 bg-black/90 rounded border border-[#fbba18]/50 shadow-md">
                                {minToTimeStr(dragState.effectiveStartMin)}–{minToTimeStr(dragState.effectiveEndMin)} ({((dragState.effectiveEndMin - dragState.effectiveStartMin) / 60).toFixed(1).replace('.0', '')}h)
                              </span>
                            </div>
                          ) : (
                            selectedStationId === station.id &&
                            selectedStartHour &&
                            selectedEndHour && (() => {
                              const [sh, sm] = selectedStartHour.split(':').map(Number);
                              const [eh, em] = selectedEndHour.split(':').map(Number);
                              const sMin = sh * 60 + sm;
                              const eMin = eh * 60 + em;
                              if (eMin > sMin && sMin >= OPEN_MIN && eMin <= CLOSE_MIN) {
                                const selLeft = ((sMin - OPEN_MIN) / TOTAL_MIN) * 100;
                                const selWidth = ((eMin - sMin) / TOTAL_MIN) * 100;
                                return (
                                  <div
                                    className="absolute top-0.5 bottom-0.5 z-20 rounded-md bg-[#fbba18]/25 border-2 border-[#fbba18] text-[#fbba18] font-mono text-[9px] font-bold flex items-center justify-center pointer-events-none select-none shadow-[0_0_10px_rgba(251,186,24,0.35)]"
                                    style={{ left: `${selLeft}%`, width: `${selWidth}%` }}
                                  >
                                    <span className="truncate px-1 bg-black/80 py-0.5 rounded border border-[#fbba18]/40">
                                      {selectedStartHour}–{selectedEndHour}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. PISTEIDEN KORTIT */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedStations.map((station) => {
                const intervals = computeStationIntervals(station);
                const busyIntervals = intervals.filter((it) => it.type !== 'free');
                const freeIntervals = intervals.filter((it) => it.type === 'free');

                return (
                  <div key={station.id} className="p-3 rounded-xl bg-[#14161f] border border-[#2d323f] flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222632]">
                      <div className="flex items-center gap-2">
                        {getStationIcon(station.type)}
                        <div>
                          <h4 className="text-xs font-bold text-white">{station.name}</h4>
                          <span className="text-[10px] text-gray-400">{station.type}</span>
                        </div>
                      </div>
                      {station.usesSharedTv && (
                        <span className="text-[9px] font-bold text-[#d89619] bg-[#d89619]/15 border border-[#d89619]/30 px-1.5 py-0.5 rounded">
                          {t('booking.sharedTvBadge')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {busyIntervals.length === 0 ? (
                        <div className="flex items-center justify-between py-1">
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('schedule.freeAllDay')}</span>
                          </span>
                          {onSelectSlot && (
                            <button
                              type="button"
                              className="px-2 py-1 rounded bg-[#d89619]/15 hover:bg-[#d89619]/25 border border-[#d89619]/35 text-[#fbba18] text-[10px] font-bold cursor-pointer"
                              onClick={() => onSelectSlot(station.id, '10:00', '12:00')}
                            >
                              {t('schedule.quickSelectSlot')} (10–12)
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {isEn ? 'Booked Times' : 'Varatut ajat'}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {busyIntervals.map((b, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                  b.type === 'tv-locked'
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                    : b.type === 'room-locked'
                                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                }`}
                              >
                                {b.startStr}–{b.endStr}
                              </span>
                            ))}
                          </div>

                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1">
                            {t('schedule.free')}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {freeIntervals.map((f, fIdx) => (
                              <button
                                key={fIdx}
                                type="button"
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 ${
                                  onSelectSlot ? 'hover:bg-emerald-500/25 cursor-pointer' : ''
                                }`}
                                onClick={() => handleSlotClick(station.id, f)}
                              >
                                {f.startStr}–{f.endStr}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. YHTEENVETO KAIKISTA PÄIVÄN VARAUKSISTA */}
          {viewMode === 'summary' && (
            <div className="overflow-x-auto border border-[#2d323f] rounded-xl bg-[#111318]">
              {(!dayReservations || dayReservations.length === 0) ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  {t('schedule.noBookingsForDay')}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0c0d11] border-b border-[#2d323f] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">{t('schedule.time')}</th>
                      <th className="px-3 py-2">{t('schedule.station')}</th>
                      <th className="px-3 py-2">{t('schedule.type')}</th>
                      <th className="px-3 py-2">{t('schedule.bookerInfo')}</th>
                      <th className="px-3 py-2">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1f28]">
                    {dayReservations.map((r) => {
                      const start = parseTimeToMinutes(r.startUtc).timeStr;
                      const end = parseTimeToMinutes(r.endUtc).timeStr;
                      const station = stations?.find((s) => s.id === r.gamingStationId);
                      const targetName =
                        r.reservationType === 'Room' || r.reservationType === 'Event'
                          ? 'Koko tila'
                          : station?.name || 'Pelipiste';

                      return (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-3 py-2 font-mono font-bold text-white">
                            klo {start} – {end}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-200">{targetName}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d89619]/15 border border-[#d89619]/30 text-[#fbba18]">
                              {r.reservationType === 'Event'
                                ? t('booking.type.event')
                                : r.reservationType === 'Room'
                                ? t('booking.type.room')
                                : t('booking.type.individual')}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col">
                              <span className="font-semibold text-white">{r.bookerName || 'Opiskelija'}</span>
                              {r.bookerEmail && (
                                <a href={`mailto:${r.bookerEmail}`} className="text-gray-400 hover:text-white text-[11px]">
                                  {r.bookerEmail}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {r.bookerEmail && (
                              <a
                                href={`mailto:${r.bookerEmail}?subject=Pelihuonevaraus klo ${start}–${end}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1c1f28] hover:bg-[#282d3a] border border-[#2d323f] text-gray-300 hover:text-white text-[11px] font-medium"
                              >
                                <Mail className="w-3 h-3 text-[#d89619]" />
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
