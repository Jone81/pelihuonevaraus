import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { CancelReservationRequest, Reservation } from '../types';

export const MyReservations: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: allReservations, isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => {
      const currentTime = Date.now();
      const past = new Date(currentTime - 7 * 24 * 60 * 60 * 1000).toISOString();
      const future = new Date(currentTime + 60 * 24 * 60 * 60 * 1000).toISOString();
      return api.getActiveReservations(past, future);
    },
    enabled: !!user,
  });

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: CancelReservationRequest }) =>
      api.cancelReservation(id, req),
    onSuccess: () => {
      setCancelError(null);
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setCancelError(err.message);
      } else {
        setCancelError('Varauksen peruutus epäonnistui.');
      }
    },
  });

  if (!user) {
    return (
      <div className="alert alert-info">
        {t('myBookings.requireLogin')}
      </div>
    );
  }

  const myBookings = allReservations?.filter((r) => r.userId === user.id) ?? [];
  const now = new Date();

  const handleCancel = (reservation: Reservation) => {
    if (!confirm(t('myBookings.cancelConfirm'))) {
      return;
    }

    cancelMutation.mutate({
      id: reservation.id,
      req: { userId: user.id, reason: 'Käyttäjän itsensä peruma' },
    });
  };

  return (
    <div className="reservations-container">
      <div className="section-header">
        <h2>{t('myBookings.title')}</h2>
        <p className="section-description">
          {t('myBookings.desc')}
        </p>
      </div>

      {cancelError && <div className="alert alert-error">{cancelError}</div>}

      {isLoading ? (
        <div className="loading-state">{t('booking.checkingAvailable')}</div>
      ) : myBookings.length === 0 ? (
        <div className="empty-state">
          <p>{t('myBookings.noneActive')}</p>
        </div>
      ) : (
        <div className="booking-list">
          {myBookings.map((booking) => {
            const start = new Date(booking.startUtc);
            const end = new Date(booking.endUtc);
            const hasStarted = now >= start;
            const station = stations?.find((s) => s.id === booking.gamingStationId);

            return (
              <div
                key={booking.id}
                className={`booking-card ${booking.status === 'Cancelled' ? 'booking-cancelled' : ''}`}
              >
                <div className="booking-card-main">
                  <div className="booking-card-header">
                    <span className="booking-title">
                      {booking.reservationType === 'Individual'
                        ? `🎮 ${station?.name || 'PC / Konsoli'}`
                        : booking.reservationType === 'Room'
                        ? `🏢 ${t('booking.type.room')}`
                        : `🏆 ${t('booking.type.event')}`}
                    </span>
                    <span className={`status-pill ${booking.status === 'Active' ? 'pill-free' : 'pill-busy'}`}>
                      {booking.status === 'Active' ? (lang === 'en' ? 'Active' : 'Aktiivinen') : (lang === 'en' ? 'Cancelled' : 'Peruttu')}
                    </span>
                  </div>

                  <div className="booking-time-info">
                    <span className="booking-date">
                      📅 {start.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="booking-hours">
                      ⏰ {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {booking.cancellationReason && (
                    <div className="cancellation-reason">
                      Syy: {booking.cancellationReason}
                    </div>
                  )}
                </div>

                {booking.status === 'Active' && (
                  <div className="booking-card-actions">
                    <button
                      type="button"
                      className="btn btn-danger btn-touch"
                      onClick={() => handleCancel(booking)}
                      disabled={hasStarted || cancelMutation.isPending}
                      title={hasStarted ? 'Alkanutta varausta ei voi perua' : t('myBookings.cancel')}
                    >
                      {hasStarted ? (lang === 'en' ? 'In progress' : 'Käynnissä') : (cancelMutation.isPending ? t('myBookings.cancelling') : t('myBookings.cancel'))}
                    </button>
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
