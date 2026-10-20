import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface RealtimeStatusProps {
  onOpenFloorPlan?: () => void;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ onOpenFloorPlan }) => {
  const { t } = useLanguage();
  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  const { data: availableStations, isLoading: loadingAvailable, refetch } = useQuery({
    queryKey: ['available-now'],
    queryFn: () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      return api.getAvailableStations(now.toISOString(), oneHourLater.toISOString());
    },
    refetchInterval: 30000, // Päivitä 30 sekunnin välein
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

      {loadingStations || loadingAvailable ? (
        <div className="loading-state">{t('booking.checkingAvailable')}</div>
      ) : (
        <div className="station-grid">
          {stations?.map((station) => {
            const isAvailable = availableIds.has(station.id);
            const isTvLocked = station.usesSharedTv && isSharedTvInUse && !isAvailable;

            return (
              <div
                key={station.id}
                className={`station-card ${isAvailable ? 'station-free' : 'station-busy'}`}
              >
                <div className="station-card-header">
                  <span className="station-icon">
                    {station.type === 'PC' ? '🖥️' : station.type === 'PlayStation5' ? '🎮' : '🕹️'}
                  </span>
                  <span className={`status-pill ${isAvailable ? 'pill-free' : 'pill-busy'}`}>
                    {isAvailable ? t('status.free') : isTvLocked ? 'TV ' + t('status.busy') : t('status.busy')}
                  </span>
                </div>
                <h3 className="station-name">{station.name}</h3>
                <span className="station-type">{station.type}</span>

                {station.usesSharedTv && (
                  <div className="shared-tv-tag">
                    {t('booking.sharedTvBadge')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
