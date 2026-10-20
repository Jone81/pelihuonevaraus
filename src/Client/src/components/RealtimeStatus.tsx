import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { DailyScheduleViewer } from './DailyScheduleViewer';
import type { GamingStation } from '../types';

interface RealtimeStatusProps {
  onOpenFloorPlan?: () => void;
  onNavigateToBooking?: (stationId?: string, startHour?: string, endHour?: string) => void;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  onOpenFloorPlan,
  onNavigateToBooking,
}) => {
  const { t } = useLanguage();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isToday = selectedDate === todayStr;

  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  // Haetaan reaaliaikainen tilanne tälle hetkelle
  const { data: availableStations, isLoading: loadingAvailable, refetch } = useQuery({
    queryKey: ['available-now'],
    queryFn: () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      return api.getAvailableStations(now.toISOString(), oneHourLater.toISOString());
    },
    refetchInterval: 30000,
  });

  const { data: activeReservations } = useQuery({
    queryKey: ['active-reservations-now'],
    queryFn: () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      return api.getActiveReservations(now.toISOString(), oneHourLater.toISOString());
    },
    refetchInterval: 30000,
  });

  // Haetaan myös valitun päivän varaukset laitekohtaista päiväyhteenvetoa varten
  const startDayUtc = new Date(`${selectedDate}T00:00:00`).toISOString();
  const endDayUtc = new Date(`${selectedDate}T23:59:59`).toISOString();
  const { data: dayReservations } = useQuery({
    queryKey: ['reservations-day', selectedDate],
    queryFn: () => api.getActiveReservations(startDayUtc, endDayUtc),
    refetchInterval: 30000,
  });

  const activeRoomReservation = activeReservations?.find(
    (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
  );

  const availableIds = new Set(availableStations?.map((s) => s.id) ?? []);

  // Tarkistetaan SharedTV-lukon tilanne
  const ps5 = stations?.find((s) => s.type === 'PlayStation5');
  const switchSt = stations?.find((s) => s.type === 'NintendoSwitch');

  const ps5Available = ps5 ? availableIds.has(ps5.id) : false;
  const switchAvailable = switchSt ? availableIds.has(switchSt.id) : false;

  const isSharedTvInUse = ps5 && switchSt && (!ps5Available || !switchAvailable);

  // Apufunktio laitekohtaisten päivävarausten hakemiseen
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

    const formatTime = (iso: string) => {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return {
      direct: direct.map((r) => ({
        time: `${formatTime(r.startUtc)}–${formatTime(r.endUtc)}`,
        booker: r.bookerName || 'Opiskelija',
      })),
      room: room.map((r) => ({
        time: `${formatTime(r.startUtc)}–${formatTime(r.endUtc)}`,
        type: r.reservationType,
        booker: r.bookerName || 'Tila varattu',
      })),
      tvLocked: tvConflict.map((r) => ({
        time: `${formatTime(r.startUtc)}–${formatTime(r.endUtc)}`,
      })),
    };
  };

  return (
    <div className="status-container">
      <div className="section-header">
        <div>
          <h2>🟢 {t('status.title')}</h2>
          <p className="section-description">
            {t('status.desc')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onOpenFloorPlan && (
            <button
              type="button"
              className="btn btn-secondary btn-touch"
              onClick={onOpenFloorPlan}
            >
              {t('booking.openFloorPlan')}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-touch"
            onClick={() => refetch()}
          >
            {t('status.refresh')}
          </button>
        </div>
      </div>

      {activeRoomReservation && (
        <div className="alert alert-warning" role="alert">
          🏢 <strong>{t('status.roomBookedNow')} ({activeRoomReservation.reservationType === 'Event' ? t('booking.type.event') : t('booking.type.room')}):</strong>{' '}
          {activeRoomReservation.bookerName ? (
            <>
              {t('status.booker')} <strong>{activeRoomReservation.bookerName}</strong>{' '}
              {activeRoomReservation.bookerEmail && (
                <a href={`mailto:${activeRoomReservation.bookerEmail}`} className="booker-email-link">
                  ({activeRoomReservation.bookerEmail})
                </a>
              )}. {t('booking.contactBooker')}
            </>
          ) : (
            'Tila on varattu ryhmäkäyttöön.'
          )}
        </div>
      )}

      {isSharedTvInUse && (
        <div className="alert alert-info">
          {t('status.sharedTvInUse')}
        </div>
      )}

      {/* Pikalaitelaatikot (Live status + päivän varaukset) */}
      {loadingStations || loadingAvailable ? (
        <div className="loading-state">{t('booking.checkingAvailable')}</div>
      ) : (
        <div className="station-grid">
          {stations?.map((station) => {
            const isAvailable = availableIds.has(station.id);
            const isTvLocked = station.usesSharedTv && isSharedTvInUse && !isAvailable;
            const summary = getStationBookingsSummary(station);
            const hasBookingsToday = summary && (summary.direct.length > 0 || summary.room.length > 0 || summary.tvLocked.length > 0);

            return (
              <div
                key={station.id}
                className={`station-card ${isAvailable ? 'station-free' : 'station-busy'}`}
              >
                <div className="station-card-header">
                  <div className="station-card-identity">
                    <span className="station-icon">
                      {station.type === 'PC' ? '🖥️' : station.type === 'PlayStation5' ? '🎮' : '🕹️'}
                    </span>
                    <div className="station-card-title-group">
                      <h3 className="station-name">{station.name}</h3>
                      <span className="station-type">{station.type}</span>
                    </div>
                  </div>
                  <div className="station-card-badges">
                    {station.usesSharedTv && (
                      <span className="tv-badge">
                        📺 {t('booking.sharedTvBadge')}
                      </span>
                    )}
                    <span className={`status-pill ${isAvailable ? 'pill-free' : 'pill-busy'}`}>
                      {isToday
                        ? isAvailable
                          ? t('status.free')
                          : isTvLocked
                          ? 'TV ' + t('status.busy')
                          : t('status.busy')
                        : hasBookingsToday
                        ? t('schedule.busy')
                        : t('schedule.free')}
                    </span>
                  </div>
                </div>

                {/* Päivän varatut ajat tälle laitteelle vaikka nyt olisi vapaana */}
                <div className="station-day-schedule-preview">
                  <div className="schedule-preview-title">
                    📅 {isToday ? t('schedule.today') : selectedDate}:
                  </div>
                  {hasBookingsToday ? (
                    <div className="schedule-preview-pills">
                      {summary.direct.map((b, idx) => (
                        <span key={`dir-${idx}`} className="preview-pill preview-pill-busy" title={`Varaaja: ${b.booker}`}>
                          🔒 {b.time} ({b.booker})
                        </span>
                      ))}
                      {summary.tvLocked.map((tv, idx) => (
                        <span key={`tv-${idx}`} className="preview-pill preview-pill-tv" title="TV käytössä toisella konsolilla">
                          📺 {tv.time} TV
                        </span>
                      ))}
                      {summary.room.map((rm, idx) => (
                        <span key={`rm-${idx}`} className="preview-pill preview-pill-room" title={`Koko tila: ${rm.booker}`}>
                          🏢 {rm.time} {rm.type}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="preview-all-free">
                      🟢 {t('schedule.freeAllDay')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Päiväkohtainen aikataulumatriisi ja kaikkien varausten tarkastelu */}
      <div style={{ marginTop: '2.5rem' }}>
        <DailyScheduleViewer
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onSelectSlot={
            onNavigateToBooking
              ? (stationId, sHour, eHour) => onNavigateToBooking(stationId, sHour, eHour)
              : undefined
          }
          showDateSelector={true}
        />
      </div>
    </div>
  );
};
