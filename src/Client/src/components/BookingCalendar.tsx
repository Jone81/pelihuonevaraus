import React, { useState, useId } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { CreateReservationRequest, ReservationType } from '../types';

interface BookingCalendarProps {
  onRequireLogin: () => void;
  onSuccessBooking: () => void;
  onOpenFloorPlan: () => void;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  onRequireLogin,
  onSuccessBooking,
  onOpenFloorPlan,
}) => {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const formInstanceId = useId();

  // Päivämäärärajat (tänään - 2 kk eteenpäin)
  const [dateBounds] = useState(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Jos tänään on viikonloppu tai kello on jo 17:00 jälkeen, ehdotetaan oletuksena seuraavaa arkipäivää
    const d = new Date();
    if (d.getHours() >= 17 || d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
      while (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() + 1);
      }
    }
    const defaultDateStr = d.toISOString().split('T')[0];

    const maxD = new Date();
    maxD.setMonth(maxD.getMonth() + 2);
    const maxStr = maxD.toISOString().split('T')[0];
    return { today: todayStr, defaultDate: defaultDateStr, maxDateStr: maxStr };
  });

  const [date, setDate] = useState(dateBounds.defaultDate);
  const [startHour, setStartHour] = useState('10:00');
  const [endHour, setEndHour] = useState('12:00');
  const [reservationType, setReservationType] = useState<ReservationType>(1);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Muodostetaan UTC ISO-aikaleimat
  const startDateTime = new Date(`${date}T${startHour}:00`);
  const endDateTime = new Date(`${date}T${endHour}:00`);
  const startUtc = startDateTime.toISOString();
  const endUtc = endDateTime.toISOString();

  // Haetaan kaikki aktiiviset laitteet
  const { data: allStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  // Haetaan dynaamisesti vapaat laitteet valitulle aikavälille
  const {
    data: availableStations,
    isLoading: loadingAvailable,
    isError: errorLoadingAvailable,
    error: availableError,
  } = useQuery({
    queryKey: ['available-stations', startUtc, endUtc],
    queryFn: () => api.getAvailableStations(startUtc, endUtc),
    enabled: endDateTime > startDateTime,
  });

  // Haetaan aktiiviset varaukset valitulle aikavälille (tarkistetaan tilavaraukset ja varaajat)
  const { data: activeReservations } = useQuery({
    queryKey: ['reservations', startUtc, endUtc],
    queryFn: () => api.getActiveReservations(startUtc, endUtc),
    enabled: endDateTime > startDateTime,
  });

  const roomConflictReservation = activeReservations?.find(
    (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
  );

  // Luodaan varaus TanStack Mutationilla
  const reservationMutation = useMutation({
    mutationFn: (req: CreateReservationRequest) => api.createReservation(req),
    onSuccess: () => {
      setConflictMessage(null);
      setGeneralError(null);
      // Invalidoi kyselyt
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      onSuccessBooking();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        // Tuotantosääntö: Käsittele 409 Conflict invalidoimalla välimuisti välittömästi
        if (err.status === 409 || err.problem?.status === 409) {
          setConflictMessage(
            '⚠️ 409 Ristiriita: Valittu pelipiste tai konsolien yhteinen TV ehdittiin varata toisen käyttäjän toimesta hetki sitten! Välimuisti on päivitetty, valitse toinen laite tai aikaväli.'
          );
          queryClient.invalidateQueries({ queryKey: ['available-stations'] });
          queryClient.invalidateQueries({ queryKey: ['available-now'] });
          queryClient.invalidateQueries({ queryKey: ['stations'] });
          return;
        }

        setGeneralError(err.message);
      } else {
        setGeneralError('Varauksen luonti epäonnistui.');
      }
    },
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictMessage(null);
    setGeneralError(null);

    if (!user) {
      onRequireLogin();
      return;
    }

    if (endDateTime <= startDateTime) {
      setGeneralError('Loppuajan on oltava alkuajan jälkeen.');
      return;
    }

    if (startDateTime.getTime() < Date.now() - 5 * 60 * 1000) {
      setGeneralError('Valittu alkamisaika on jo menneisyydessä. Valitse kuluvaa kellonaikaa myöhäisempi aika tai toinen päivä.');
      return;
    }

    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      setGeneralError('Varauksen vähimmäiskesto on 30 minuuttia.');
      return;
    }

    if (reservationType === 1) {
      if (!selectedStationId) {
        setGeneralError('Valitse haluamasi pelipiste.');
        return;
      }
      if (durationMinutes > 240) {
        setGeneralError('Yksittäisvarauksen enimmäiskesto on 4 tuntia.');
        return;
      }
    } else {
      if (!isAdmin && durationMinutes > 240) {
        setGeneralError('Opiskelijan tilavarauksen enimmäiskesto on 4 tuntia. Pidemmät varaukset vaativat Admin-oikeudet.');
        return;
      }
      if (durationMinutes > 600) {
        setGeneralError('Tilavarauksen enimmäiskesto on 10 tuntia (aukioloajan puitteissa).');
        return;
      }
    }

    const request: CreateReservationRequest = {
      idempotencyKey: `${user.id}-${Date.now()}-${formInstanceId}`,
      userId: user.id,
      reservationType,
      gamingStationId: reservationType === 1 ? selectedStationId : null,
      startUtc,
      endUtc,
    };

    reservationMutation.mutate(request);
  };

  const selectedStation = allStations?.find((s) => s.id === selectedStationId);

  return (
    <div className="booking-container">
      <div className="section-header">
        <div>
          <h2>📅 {t('booking.title')}</h2>
          <p className="section-description">
            {t('booking.desc')}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-touch"
          onClick={onOpenFloorPlan}
        >
          {t('booking.openFloorPlan')}
        </button>
      </div>

      {conflictMessage && (
        <div className="alert alert-error" role="alert">
          {conflictMessage}
        </div>
      )}

      {generalError && (
        <div className="alert alert-error" role="alert">
          {generalError}
        </div>
      )}

      <form onSubmit={handleBooking} className="booking-form">
        {/* Varaustyypin valinta */}
        <div className="form-group">
          <label>{t('booking.typeLabel')}</label>
          <div className="type-selector">
            <button
              type="button"
              className={`type-btn btn-touch ${reservationType === 1 ? 'type-btn-active' : ''}`}
              onClick={() => setReservationType(1)}
            >
              {t('booking.type.individual')}
            </button>
            <button
              type="button"
              className={`type-btn btn-touch ${reservationType === 2 ? 'type-btn-active' : ''}`}
              onClick={() => setReservationType(2)}
            >
              {isAdmin ? t('booking.type.roomAdmin') : t('booking.type.room')}
            </button>
            {isAdmin && (
              <button
                type="button"
                className={`type-btn btn-touch ${reservationType === 3 ? 'type-btn-active' : ''}`}
                onClick={() => setReservationType(3)}
              >
                {t('booking.type.event')}
              </button>
            )}
          </div>
        </div>

        {/* Tilavarauksen tiedote */}
        {reservationType === 2 && (
          <div className="alert alert-info">
            🏢 <strong>{t('booking.roomNotice')}</strong>
          </div>
        )}

        {roomConflictReservation && (
          <div className="alert alert-warning" role="alert">
            ⚠️ <strong>{t('booking.roomConflict')} ({roomConflictReservation.reservationType === 'Event' ? t('booking.type.event') : t('booking.type.room')}):</strong>{' '}
            {t('booking.booker')} <strong>{roomConflictReservation.bookerName || 'Muu opiskelija'}</strong>{' '}
            {roomConflictReservation.bookerEmail && (
              <a href={`mailto:${roomConflictReservation.bookerEmail}`} className="booker-email-link">
                ({roomConflictReservation.bookerEmail})
              </a>
            )}. {t('booking.contactBooker')}
          </div>
        )}

        {/* Päivämäärä ja ajat */}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="date">{t('booking.date')}</label>
            <input
              id="date"
              type="date"
              className="input-touch"
              min={dateBounds.today}
              max={dateBounds.maxDateStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startHour">{t('booking.startTime')}</label>
            <select
              id="startHour"
              className="input-touch"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
            >
              {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'].map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="endHour">{t('booking.endTime')}</label>
            <select
              id="endHour"
              className="input-touch"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
            >
              {['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pelipisteen valinta yksittäisvarauksille */}
        {reservationType === 1 && (
          <div className="form-group">
            <label>{t('booking.selectStation')} ({startHour} - {endHour})</label>
            {loadingAvailable ? (
              <div className="loading-state">{t('booking.checkingAvailable')}</div>
            ) : errorLoadingAvailable ? (
              <div className="alert alert-error">
                {availableError instanceof Error
                  ? availableError.message
                  : 'Pelipisteiden saatavuuden tarkistus epäonnistui. Tarkista valittu aika ja verkkoyhteys.'}
              </div>
            ) : availableStations && availableStations.length > 0 ? (
              <div className="station-select-grid">
                {availableStations.map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    className={`station-select-card btn-touch ${selectedStationId === station.id ? 'station-selected' : ''}`}
                    onClick={() => setSelectedStationId(station.id)}
                  >
                    <span className="station-icon">
                      {station.type === 'PC' ? '🖥️' : station.type === 'PlayStation5' ? '🎮' : '🕹️'}
                    </span>
                    <span className="station-title">{station.name}</span>
                    <span className="station-meta">{station.type}</span>
                    {station.usesSharedTv && (
                      <span className="tv-badge">{t('booking.sharedTvBadge')}</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="alert alert-warning">
                {t('booking.noAvailable')}
              </div>
            )}
          </div>
        )}

        {/* SharedTV-ilmoitus */}
        {selectedStation?.usesSharedTv && (
          <div className="alert alert-info">
            📺 <strong>{t('booking.sharedTvNotice')}</strong>
          </div>
        )}

        {/* Toimintopainike */}
        <div className="booking-submit">
          <button
            type="submit"
            className="btn btn-primary btn-touch btn-large"
            disabled={reservationMutation.isPending || (Boolean(user) && reservationType === 1 && !selectedStationId)}
          >
            {reservationMutation.isPending ? t('booking.processing') : user ? t('booking.submit') : t('booking.loginToBook')}
          </button>
        </div>
      </form>
    </div>
  );
};
