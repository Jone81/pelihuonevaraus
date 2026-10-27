import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ClipboardList,
  Calendar,
  Clock,
  Building,
  Monitor,
  Gamepad2,
  Gamepad,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { CancelReservationRequest, Reservation } from '../types';

export const MyReservations: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const isEn = lang === 'en';
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
        setCancelError(isEn ? 'Failed to cancel reservation.' : 'Varauksen peruutus epäonnistui.');
      }
    },
  });

  if (!user) {
    return (
      <div className="p-6 rounded-2xl bg-[#181a20] border border-[#2d323f] text-gray-300 text-xs text-center shadow-xl">
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

  const getTargetIcon = (reservation: Reservation, stationType?: string) => {
    if (reservation.reservationType === 'Room' || reservation.reservationType === 'Event') {
      return <Building className="w-4 h-4 text-amber-400" />;
    }
    if (stationType === 'PlayStation5') return <Gamepad2 className="w-4 h-4 text-purple-400" />;
    if (stationType === 'NintendoSwitch' || stationType === 'Switch') return <Gamepad className="w-4 h-4 text-rose-400" />;
    return <Monitor className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="w-full max-w-full flex flex-col gap-6">
      {/* Yläkortti: Otsikko */}
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col items-start">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#d89619]" />
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white font-sans">
            {t('myBookings.title')}
          </h2>
        </div>
        <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
        <p className="text-xs text-gray-400 mt-2">{t('myBookings.desc')}</p>
      </div>

      {cancelError && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{cancelError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400 bg-[#181a20] rounded-2xl border border-[#2d323f]">
          <div className="w-6 h-6 border-2 border-[#d89619] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">{t('booking.checkingAvailable')}</span>
        </div>
      ) : myBookings.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-xs bg-[#181a20] rounded-2xl border border-[#2d323f]">
          {t('myBookings.noneActive')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myBookings.map((booking) => {
            const start = new Date(booking.startUtc);
            const end = new Date(booking.endUtc);
            const hasStarted = now >= start;
            const isCancelled = booking.status === 'Cancelled';
            const station = stations?.find((s) => s.id === booking.gamingStationId);

            const targetName =
              booking.reservationType === 'Individual'
                ? station?.name || 'Pelipiste'
                : booking.reservationType === 'Room'
                ? t('booking.type.room')
                : t('booking.type.event');

            return (
              <div
                key={booking.id}
                className={`bg-[#181a20] border rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 transition-all ${
                  isCancelled
                    ? 'border-gray-800 bg-[#14151b] opacity-60'
                    : 'border-[#2d323f] hover:border-[#fbba18]/40'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[#111318] border border-[#252936]">
                        {getTargetIcon(booking, station?.type)}
                      </div>
                      <span className="font-bold text-sm text-white">{targetName}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCancelled
                          ? 'bg-gray-800 text-gray-400 border border-gray-700'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isCancelled
                        ? isEn ? 'Cancelled' : 'Peruttu'
                        : isEn ? 'Active' : 'Aktiivinen'}
                    </span>
                  </div>

                  {/* Aikatiedot */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#252936]">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Calendar className="w-3.5 h-3.5 text-[#fbba18] flex-shrink-0" />
                      <span className="capitalize">
                        {start.toLocaleDateString(isEn ? 'en-GB' : 'fi-FI', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-300 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#fbba18] flex-shrink-0" />
                      <span>
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {booking.cancellationReason && (
                    <div className="text-[11px] text-gray-400 bg-white/5 p-2 rounded-lg">
                      {isEn ? 'Reason:' : 'Syy:'} {booking.cancellationReason}
                    </div>
                  )}
                </div>

                {/* Toimintopainike: Peruuta varaus */}
                {!isCancelled && (
                  <div className="pt-2 border-t border-[#252936] flex items-center justify-end">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                      onClick={() => handleCancel(booking)}
                      disabled={hasStarted || cancelMutation.isPending}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>
                        {hasStarted
                          ? isEn ? 'In progress' : 'Käynnissä'
                          : cancelMutation.isPending
                          ? t('myBookings.cancelling')
                          : t('myBookings.cancel')}
                      </span>
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
