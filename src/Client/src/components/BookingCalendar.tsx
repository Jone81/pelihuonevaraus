import React, { useState, useId, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DailyScheduleViewer } from './DailyScheduleViewer';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Gamepad2,
  Gamepad,
  Monitor,
  Building,
  Trophy,
  Map,
  ArrowRight,
  AlertCircle,
  Tv,
} from 'lucide-react';
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
  const formDateInputRef = useRef<HTMLInputElement>(null);

  const startDateTime = new Date(`${date}T${startHour}:00`);
  const endDateTime = new Date(`${date}T${endHour}:00`);
  const startUtc = startDateTime.toISOString();
  const endUtc = endDateTime.toISOString();

  const { data: allStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

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

  const { data: activeReservations } = useQuery({
    queryKey: ['reservations', startUtc, endUtc],
    queryFn: () => api.getActiveReservations(startUtc, endUtc),
    enabled: endDateTime > startDateTime,
  });

  const roomConflictReservation = activeReservations?.find(
    (r) => r.reservationType === 'Room' || r.reservationType === 'Event'
  );

  const reservationMutation = useMutation({
    mutationFn: (req: CreateReservationRequest) => api.createReservation(req),
    onSuccess: () => {
      setConflictMessage(null);
      setGeneralError(null);
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      onSuccessBooking();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.problem?.status === 409) {
          setConflictMessage(
            'Ristiriita: Valittu pelipiste tai konsolien yhteinen TV ehdittiin varata toisen toimesta hetki sitten! Valitse toinen aika tai piste.'
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
      setGeneralError('Valittu alkamisaika on jo menneisyydessä.');
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
        setGeneralError('Opiskelijan tilavarauksen enimmäiskesto on 4 tuntia.');
        return;
      }
      if (durationMinutes > 600) {
        setGeneralError('Tilavarauksen enimmäiskesto on 10 tuntia.');
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

  const getStationIcon = (type: string) => {
    if (type === 'PlayStation5') return <Gamepad2 className="w-4 h-4 text-purple-400 flex-shrink-0" />;
    if (type === 'NintendoSwitch' || type === 'Switch') return <Gamepad className="w-4 h-4 text-rose-400 flex-shrink-0" />;
    return <Monitor className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
  };

  return (
    <div className="w-full max-w-full">
      <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* =========================================================
            VASEN KORTTI: Tee uusi varaus
            ========================================================= */}
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 md:p-7 shadow-xl flex flex-col gap-5 min-w-0 max-w-full">
          <div className="flex flex-col items-start pb-1">
            <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-sans">
              Tee uusi varaus
            </h2>
            <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
          </div>

          {conflictMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{conflictMessage}</span>
            </div>
          )}

          {generalError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Varaustyyppivalitsin */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {t('booking.typeLabel')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                  reservationType === 1
                    ? 'bg-[#222631] text-white border border-[#d89619] shadow-sm font-bold'
                    : 'bg-[#111318] text-gray-400 border border-[#2d323f] hover:text-white'
                }`}
                onClick={() => setReservationType(1)}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="truncate">{t('booking.type.individual')}</span>
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                  reservationType === 2
                    ? 'bg-[#222631] text-white border border-[#d89619] shadow-sm font-bold'
                    : 'bg-[#111318] text-gray-400 border border-[#2d323f] hover:text-white'
                }`}
                onClick={() => setReservationType(2)}
              >
                <Building className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate">{isAdmin ? t('booking.type.roomAdmin') : t('booking.type.room')}</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                    reservationType === 3
                      ? 'bg-[#222631] text-white border border-[#d89619] shadow-sm font-bold'
                      : 'bg-[#111318] text-gray-400 border border-[#2d323f] hover:text-white'
                  }`}
                  onClick={() => setReservationType(3)}
                >
                  <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                  <span className="truncate">{t('booking.type.event')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tilavarauksen huomautus */}
          {reservationType === 2 && (
            <div className="p-3 rounded-xl bg-[#d89619]/10 border border-[#d89619]/30 text-[#fbba18] text-xs leading-relaxed flex items-start gap-2">
              <Building className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{t('booking.roomNotice')}</span>
            </div>
          )}

          {roomConflictReservation && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>{t('booking.roomConflict')}:</strong>{' '}
                {t('booking.booker')} <strong>{roomConflictReservation.bookerName || 'Muu opiskelija'}</strong>
              </div>
            </div>
          )}

          {/* Päivämäärä ja kellonajat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="date"
                className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:text-[#fbba18] transition-colors"
                onClick={() => {
                  try {
                    formDateInputRef.current?.showPicker();
                  } catch {
                    formDateInputRef.current?.focus();
                  }
                }}
              >
                <Calendar className="w-3 h-3 text-[#d89619]" />
                <span>{t('booking.date')}</span>
              </label>
              <input
                ref={formDateInputRef}
                id="date"
                type="date"
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#d89619] hover:border-[#fbba18]/60 text-white rounded-xl px-3 text-xs outline-none transition-colors cursor-pointer"
                min={dateBounds.today}
                max={dateBounds.maxDateStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={() => {
                  try {
                    formDateInputRef.current?.showPicker();
                  } catch {}
                }}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="startHour" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#d89619]" />
                <span>{t('booking.startTime')}</span>
              </label>
              <select
                id="startHour"
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#d89619] text-white rounded-xl px-3 text-xs outline-none transition-colors cursor-pointer"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
              >
                {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'].map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="endHour" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#d89619]" />
                <span>{t('booking.endTime')}</span>
              </label>
              <select
                id="endHour"
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#d89619] text-white rounded-xl px-3 text-xs outline-none transition-colors cursor-pointer"
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
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('booking.selectStation')} ({startHour}–{endHour})
                </span>
                <button
                  type="button"
                  className="text-[11px] text-[#fbba18] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  onClick={onOpenFloorPlan}
                >
                  <Map className="w-3 h-3" />
                  <span>{t('booking.openFloorPlan')}</span>
                </button>
              </div>

              {loadingAvailable ? (
                <div className="p-4 rounded-xl bg-[#111318] border border-[#2d323f] text-gray-400 text-xs text-center flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#d89619] border-t-transparent rounded-full animate-spin" />
                  <span>{t('booking.checkingAvailable')}</span>
                </div>
              ) : errorLoadingAvailable ? (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {availableError instanceof Error ? availableError.message : 'Virhe ladattaessa vapaita laitteita.'}
                </div>
              ) : availableStations && availableStations.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableStations.map((station) => {
                    const isSelected = selectedStationId === station.id;
                    const isPs5 = station.type === 'PlayStation5';
                    const isSwitch = station.type === 'NintendoSwitch' || station.type === 'Switch';
                    const subtitle = isPs5 ? 'PS5 • 4K TV' : isSwitch ? 'Switch • 4K TV' : 'PC';

                    return (
                      <button
                        key={station.id}
                        type="button"
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 relative group ${
                          isSelected
                            ? 'bg-[#fbba18]/15 border-[#fbba18] ring-1 ring-[#fbba18] shadow-[0_0_15px_rgba(251,186,24,0.15)]'
                            : 'bg-[#111318] border-[#2b303c] hover:border-[#fbba18]/50 hover:bg-[#151821]'
                        }`}
                        onClick={() => setSelectedStationId(station.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              isPs5
                                ? 'bg-purple-500/15 text-purple-400'
                                : isSwitch
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-cyan-500/15 text-cyan-400'
                            }`}
                          >
                            {getStationIcon(station.type)}
                          </div>
                          <div className="flex flex-col min-w-0 leading-tight">
                            <span className="text-white font-bold text-xs truncate group-hover:text-[#fbba18] transition-colors">
                              {station.name}
                            </span>
                            <span className="text-gray-400 text-[10px] truncate">
                              {subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {station.usesSharedTv && (
                            <span className="text-[9px] font-bold text-[#d89619] bg-[#d89619]/15 border border-[#d89619]/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Tv className="w-2.5 h-2.5" />
                              <span>TV</span>
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-[#fbba18] text-[#0a0b0d]'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isSelected ? 'Valittu' : 'Vapaa'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
                  {t('booking.noAvailable')}
                </div>
              )}
            </div>
          )}

          {/* SharedTV-ilmoitus */}
          {selectedStation?.usesSharedTv && (
            <div className="p-3 rounded-xl bg-[#d89619]/10 border border-[#d89619]/30 text-[#fbba18] text-xs flex items-center gap-2">
              <Tv className="w-4 h-4 flex-shrink-0" />
              <span>{t('booking.sharedTvNotice')}</span>
            </div>
          )}

          {/* Vahvista varaus -painike */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="xamk"
              size="lg"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] hover:brightness-110 active:scale-[0.99] text-[#0a0b0d] font-black text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(251,186,24,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              disabled={reservationMutation.isPending || (Boolean(user) && reservationType === 1 && !selectedStationId)}
            >
              <span>{reservationMutation.isPending ? t('booking.processing') : user ? t('booking.submit') : t('booking.loginToBook')}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* =========================================================
            OIKEA KORTTI: Päivän varaukset ja aikataulu
            ========================================================= */}
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 md:p-7 shadow-xl flex flex-col gap-4 min-w-0 max-w-full">
          <div className="flex flex-col items-start pb-1">
            <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-sans">
              Päivän varaukset ja aikataulu
            </h2>
            <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
          </div>

          <DailyScheduleViewer
            selectedDate={date}
            onDateChange={(newDate) => setDate(newDate)}
            onSelectSlot={(stationId, sHour, eHour) => {
              setSelectedStationId(stationId);
              setStartHour(sHour);
              setEndHour(eHour);
              setReservationType(1);
            }}
            showDateSelector={false}
            hideHeaderTitle={true}
            lockViewMode="timeline"
            selectedStationId={selectedStationId}
            selectedStartHour={startHour}
            selectedEndHour={endHour}
          />
        </div>
      </form>
    </div>
  );
};
