import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import type { GamingStation, Reservation } from '../types';

export interface DailyScheduleViewerProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onDateChange?: (newDate: string) => void;
  onSelectSlot?: (stationId: string, startHour: string, endHour: string) => void;
  showDateSelector?: boolean;
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
const CLOSE_MIN = 19 * 60; // 19:00 = 1140 min
const TOTAL_MIN = CLOSE_MIN - OPEN_MIN; // 660 min

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

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

  // Lasketaan kullekin laitteelle aikajanaintervallit (varatut ja vapaat)
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

    // Kerätään kaikki estot ja leikataan aukioloaikaan (08:00 - 18:00)
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
          title: `${t('schedule.busy')}: ${r.bookerName || 'Käyttäjä'} (${minToTimeStr(start)}–${minToTimeStr(end)})`,
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
          title: `${t('schedule.tvLocked')}: 📺 Konsolikaapin TV varattu (${minToTimeStr(start)}–${minToTimeStr(end)})`,
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

  const handleSlotClick = (stationId: string, interval: TimeInterval) => {
    if (interval.type !== 'free' || !onSelectSlot) return;

    // Lasketaan järkevä oletuskesto (max 4h yksittäiselle laitteelle)
    const slotDurationHours = (interval.endMin - interval.startMin) / 60;
    const chosenDurationHours = Math.min(2, Math.min(4, slotDurationHours));
    const targetEndMin = Math.min(interval.endMin, interval.startMin + chosenDurationHours * 60);

    onSelectSlot(stationId, interval.startStr, minToTimeStr(targetEndMin));
  };

  const totalBookingsCount = dayReservations?.length ?? 0;

  return (
    <div className="daily-schedule-card">
      {/* Yläpalkki ja otsikko */}
      <div className="daily-schedule-header">
        <div className="schedule-header-text">
          <div className="schedule-title-row">
            <span className="schedule-icon">📅</span>
            <h3>{t('schedule.title')}</h3>
            <span className="bookings-count-pill">
              {totalBookingsCount > 0
                ? `${totalBookingsCount} ${t('schedule.todayBookingsCount')}`
                : t('schedule.noBookingsForDay')}
            </span>
          </div>
          <p className="schedule-description">{t('schedule.desc')}</p>
        </div>

        {/* Näkymävalitsin (Aikajana / Kortit / Yhteenveto) */}
        <div className="schedule-view-toggle">
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('timeline')}
            title="Näytä graafinen aikataulumatriisi"
          >
            <span className="btn-full-text">{t('schedule.timelineView')}</span>
            <span className="btn-short-text">📊 Aikataulu</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('cards')}
            title="Näytä pelipisteiden varauskortit"
          >
            <span className="btn-full-text">{t('schedule.listView')}</span>
            <span className="btn-short-text">📋 Pisteet</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('summary')}
            title="Kaikki varaukset listana"
          >
            <span className="btn-full-text">{t('schedule.summaryView')}</span>
            <span className="btn-short-text">📑 Lista</span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary refresh-icon-btn"
            onClick={() => refetch()}
            title={t('status.refresh')}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Päivämäärän valintapalkki */}
      {showDateSelector && (
        <div className="schedule-date-bar">
          <div className="date-nav-buttons">
            <button
              type="button"
              className="btn btn-secondary btn-touch date-nav-btn"
              onClick={handlePrevDay}
              aria-label={t('schedule.prevDay')}
            >
              <span className="btn-full-text">{t('schedule.prevDay')}</span>
              <span className="btn-short-text">◀</span>
            </button>

            <div className="schedule-date-picker-wrap">
              <label htmlFor="schedule-date-input" className="sr-only">
                {t('schedule.dateLabel')}
              </label>
              <div className="date-input-with-icon">
                <span className="calendar-indicator-badge" aria-hidden="true">📅</span>
                <input
                  id="schedule-date-input"
                  type="date"
                  className="input-touch schedule-date-input"
                  value={selectedDate}
                  onChange={(e) => onDateChange && onDateChange(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-touch date-nav-btn"
              onClick={handleNextDay}
              aria-label={t('schedule.nextDay')}
            >
              <span className="btn-full-text">{t('schedule.nextDay')}</span>
              <span className="btn-short-text">▶</span>
            </button>
          </div>

          <div className="date-quick-chips">
            <button
              type="button"
              className="chip-btn"
              onClick={handleSetToday}
            >
              {t('schedule.today')}
            </button>
            <button
              type="button"
              className="chip-btn"
              onClick={handleSetTomorrow}
            >
              {t('schedule.tomorrow')}
            </button>
            <span className="current-date-title">{formattedDateTitle}</span>
          </div>
        </div>
      )}

      {/* Koko tilan varaukset / Tapahtumat varoitusbanneri */}
      {roomReservations.length > 0 && (
        <div className="schedule-room-alert" role="alert">
          <div className="alert-icon">🏢</div>
          <div className="alert-content">
            <strong>{t('schedule.roomAlert')}:</strong>
            <ul className="room-res-list">
              {roomReservations.map((r) => {
                const s = parseTimeToMinutes(r.startUtc).timeStr;
                const e = parseTimeToMinutes(r.endUtc).timeStr;
                return (
                  <li key={r.id}>
                    <span className="res-badge res-room-badge">
                      {r.reservationType === 'Event' ? t('booking.type.event') : t('booking.type.room')}
                    </span>{' '}
                    <strong>klo {s} – {e}</strong> • {t('booking.booker')}{' '}
                    <strong>{r.bookerName || 'Opiskelija/Admin'}</strong>{' '}
                    {r.bookerEmail && (
                      <a href={`mailto:${r.bookerEmail}`} className="booker-email-link">
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
        <div className="loading-state">
          <div className="spinner"></div>
          <span>{t('booking.checkingAvailable')}</span>
        </div>
      ) : (
        <>
          {/* Vinkkiteksti klikkaamisesta, jos onSelectSlot on käytössä */}
          {onSelectSlot && (
            <div className="schedule-hint-bar">
              <span>💡 {t('schedule.clickSlotHint')}</span>
            </div>
          )}

          {/* 1. VISUAALINEN AIKATAULUMATRIISI (TIMELINE VIEW) */}
          {viewMode === 'timeline' && (
            <div className="timeline-container">
              {/* Väriselitteet */}
              <div className="timeline-legend">
                <span className="legend-item">
                  <span className="legend-dot dot-free"></span> {t('schedule.free')}
                </span>
                <span className="legend-item">
                  <span className="legend-dot dot-busy"></span> {t('schedule.busy')}
                </span>
                <span className="legend-item">
                  <span className="legend-dot dot-tv"></span> {t('schedule.tvLocked')}
                </span>
                {roomReservations.length > 0 && (
                  <span className="legend-item">
                    <span className="legend-dot dot-room"></span> {t('schedule.roomLocked')}
                  </span>
                )}
                <span className="legend-item sm:hidden text-[#d49a15] font-semibold text-[11px] ml-auto">
                  {isEn ? '👉 Swipe timeline 👈' : '👉 Pyyhkäise aikajanaa 👈'}
                </span>
              </div>

              <div className="timeline-scroll-area">
                {/* Tuntimerkinnät yläreunassa */}
                <div className="timeline-header-row">
                  <div className="timeline-station-col-header">
                    {t('schedule.station')}
                  </div>
                  <div className="timeline-hours-track">
                    {HOURS.map((hour, idx) => (
                      <div
                        key={hour}
                        className="timeline-hour-mark"
                        style={{ left: `${(idx / (HOURS.length - 1)) * 100}%` }}
                      >
                        <span className="hour-label">{hour}</span>
                        <span className="hour-tick"></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jokaisen pelipisteen aikajanarivi */}
                <div className="timeline-rows">
                  {stations?.map((station) => {
                    const intervals = computeStationIntervals(station);
                    return (
                      <div key={station.id} className="timeline-row">
                        {/* Laiteinfo vasemmalla */}
                        <div className="timeline-station-cell">
                          <span className="station-mini-icon">
                            {station.type === 'PC' ? '🖥️' : station.type === 'PlayStation5' ? '🎮' : '🕹️'}
                          </span>
                          <span className="station-cell-name">{station.name}</span>
                          {station.usesSharedTv && (
                            <span className="mini-tv-tag" title="Käyttää yhteistä televisiota">
                              📺 TV
                            </span>
                          )}
                        </div>

                        {/* 08:00 - 18:00 aikajana */}
                        <div className="timeline-track">
                          {/* Taustan tuntiviivat */}
                          {HOURS.slice(0, -1).map((_, idx) => (
                            <div
                              key={idx}
                              className="timeline-grid-line"
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
                                  className={`timeline-block block-free ${onSelectSlot ? 'clickable-slot' : ''}`}
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={`${station.name}: ${interval.title}${onSelectSlot ? ' - ' + t('schedule.clickSlotHint') : ''}`}
                                  onClick={() => handleSlotClick(station.id, interval)}
                                >
                                  <span className="block-label">
                                    {interval.startStr}–{interval.endStr}
                                  </span>
                                </button>
                              );
                            }

                            if (interval.type === 'tv-locked') {
                              return (
                                <div
                                  key={i}
                                  className="timeline-block block-tv-locked"
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={interval.title}
                                >
                                  <span className="block-label">
                                    📺 {interval.startStr}–{interval.endStr}
                                  </span>
                                </div>
                              );
                            }

                            if (interval.type === 'room-locked') {
                              return (
                                <div
                                  key={i}
                                  className="timeline-block block-room-locked"
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={interval.title}
                                >
                                  <span className="block-label">
                                    🏢 {interval.startStr}–{interval.endStr}
                                  </span>
                                </div>
                              );
                            }

                            // Busy block
                            return (
                              <div
                                key={i}
                                className="timeline-block block-busy"
                                style={{ left: `${left}%`, width: `${width}%` }}
                                title={interval.title}
                              >
                                <span className="block-label">
                                  🔒 {interval.startStr}–{interval.endStr}
                                  {interval.reservation?.bookerName ? ` (${interval.reservation.bookerName})` : ''}
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
            <div className="schedule-cards-grid">
              {stations?.map((station) => {
                const intervals = computeStationIntervals(station);
                const busyIntervals = intervals.filter((it) => it.type !== 'free');
                const freeIntervals = intervals.filter((it) => it.type === 'free');

                return (
                  <div key={station.id} className="schedule-station-card">
                    <div className="schedule-station-header">
                      <div className="station-title-box">
                        <span className="station-icon">
                          {station.type === 'PC' ? '🖥️' : station.type === 'PlayStation5' ? '🎮' : '🕹️'}
                        </span>
                        <div>
                          <h4 className="station-card-title">{station.name}</h4>
                          <span className="station-card-code">{station.type}</span>
                        </div>
                      </div>
                      {station.usesSharedTv && (
                        <span className="tv-badge">{t('booking.sharedTvBadge')}</span>
                      )}
                    </div>

                    <div className="station-schedule-body">
                      {busyIntervals.length === 0 ? (
                        <div className="station-all-free">
                          <span className="free-check-icon">🟢</span>
                          <span>{t('schedule.freeAllDay')}</span>
                          {onSelectSlot && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary quick-pick-btn"
                              onClick={() => onSelectSlot(station.id, '10:00', '12:00')}
                            >
                              {t('schedule.quickSelectSlot')} (10–12)
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="station-bookings-list">
                          <div className="bookings-subhead">{t('booking.upcomingToday')}</div>
                          {busyIntervals.map((b, idx) => (
                            <div
                              key={idx}
                              className={`schedule-booking-pill ${
                                b.type === 'tv-locked'
                                  ? 'pill-tv-locked'
                                  : b.type === 'room-locked'
                                  ? 'pill-room-locked'
                                  : 'pill-station-busy'
                              }`}
                            >
                              <span className="pill-time">
                                {b.startStr} – {b.endStr}
                              </span>
                              <span className="pill-desc">
                                {b.type === 'tv-locked'
                                  ? '📺 ' + t('schedule.tvLocked')
                                  : b.type === 'room-locked'
                                  ? '🏢 ' + t('schedule.roomLocked')
                                  : b.reservation?.bookerName || t('schedule.busy')}
                              </span>
                            </div>
                          ))}

                          {/* Näytetään myös vapaat ajat */}
                          <div className="free-slots-summary">
                            <span className="free-subhead">🟢 {t('schedule.free')}:</span>
                            <div className="free-chips-row">
                              {freeIntervals.map((f, fIdx) => (
                                <button
                                  key={fIdx}
                                  type="button"
                                  className={`free-chip ${onSelectSlot ? 'free-chip-clickable' : ''}`}
                                  onClick={() => handleSlotClick(station.id, f)}
                                  title={onSelectSlot ? t('schedule.clickSlotHint') : undefined}
                                >
                                  {f.startStr}–{f.endStr}
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
            <div className="schedule-summary-table-wrap">
              {(!dayReservations || dayReservations.length === 0) ? (
                <div className="empty-state-card">
                  <p>{t('schedule.noBookingsForDay')}</p>
                </div>
              ) : (
                <table className="schedule-summary-table">
                  <thead>
                    <tr>
                      <th>{t('schedule.time')}</th>
                      <th>{t('schedule.station')}</th>
                      <th>{t('schedule.type')}</th>
                      <th>{t('schedule.bookerInfo')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayReservations.map((r) => {
                      const start = parseTimeToMinutes(r.startUtc).timeStr;
                      const end = parseTimeToMinutes(r.endUtc).timeStr;
                      const station = stations?.find((s) => s.id === r.gamingStationId);
                      const targetName =
                        r.reservationType === 'Room' || r.reservationType === 'Event'
                          ? '🏢 Koko tila'
                          : station?.name || 'Pelipiste';

                      return (
                        <tr key={r.id}>
                          <td>
                            <strong className="table-time-cell">
                              klo {start} – {end}
                            </strong>
                          </td>
                          <td>
                            <span className="table-station-name">{targetName}</span>
                          </td>
                          <td>
                            <span
                              className={`res-badge ${
                                r.reservationType === 'Event'
                                  ? 'res-event-badge'
                                  : r.reservationType === 'Room'
                                  ? 'res-room-badge'
                                  : 'res-individual-badge'
                              }`}
                            >
                              {r.reservationType === 'Event'
                                ? t('booking.type.event')
                                : r.reservationType === 'Room'
                                ? t('booking.type.room')
                                : t('booking.type.individual')}
                            </span>
                          </td>
                          <td>
                            <div className="booker-contact-cell">
                              <strong>{r.bookerName || 'Opiskelija'}</strong>
                              {r.bookerEmail && (
                                <a href={`mailto:${r.bookerEmail}`} className="booker-email-link">
                                  {r.bookerEmail}
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            {r.bookerEmail && (
                              <a
                                href={`mailto:${r.bookerEmail}?subject=Pelihuonevaraus klo ${start}–${end}`}
                                className="btn btn-sm btn-secondary"
                              >
                                ✉️ {t('schedule.contactBooker')}
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
