/**
 * @file MyReservations.tsx
 * @description Kirjautuneen käyttäjän omien varausten hallintanäkymä.
 * Listaa käyttäjän varaukset (aktiiviset ja perutut) ja mahdollistaa tulevien
 * varausten peruuttamisen.
 */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gamepad2, Building2, Trophy, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from '../router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CancelReservationRequest, EndReservationRequest, Reservation } from '../types';

/**
 * Omat varaukset -näkymäkomponentti.
 */
export const MyReservations: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { setActiveTab } = useRouter();
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Haetaan varaukset viimeisen 7 päivän ja tulevan 60 päivän aikaväliltä
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

  // Haetaan pelipisteiden tiedot laitenimien näyttämistä varten
  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  // Mutaatio varauksen peruuttamiseen ja välimuistin päivittämiseen
  const cancelMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: CancelReservationRequest }) =>
      api.cancelReservation(id, req),
    onSuccess: () => {
      setCancelError(null);
      setStatusMessage(null);
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
    },
    onError: (err: unknown) => {
      setStatusMessage(null);
      if (err instanceof ApiError) {
        setCancelError(err.message);
      } else {
        setCancelError('Varauksen peruutus epäonnistui.');
      }
    },
  });

  // Mutaatio käynnissä olevan varauksen lopettamiseen kesken ja välimuistin päivittämiseen
  const endMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: EndReservationRequest }) =>
      api.endReservationEarly(id, req),
    onSuccess: () => {
      setCancelError(null);
      setStatusMessage(
        lang === 'en'
          ? 'Reservation ended early. The station is now free.'
          : 'Varaus lopetettu kesken. Pelipiste on nyt vapaa.'
      );
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
      queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
    },
    onError: (err: unknown) => {
      setStatusMessage(null);
      if (err instanceof ApiError) {
        setCancelError(err.message);
      } else {
        setCancelError(
          lang === 'en'
            ? 'Failed to end reservation early.'
            : 'Varauksen lopettaminen kesken epäonnistui.'
        );
      }
    },
  });

  // Jos käyttäjä ei ole kirjautunut, näytetään huomautus
  if (!user) {
    return (
      <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3B82F6] shadow-[4px_4px_0px_#000000] p-4 font-mono font-bold text-sm">
        {t('myBookings.requireLogin')}
      </div>
    );
  }

  // Suodatetaan vain kirjautuneen käyttäjän omat varaukset
  const myBookings = allReservations?.filter((r) => r.userId === user.id) ?? [];
  const now = new Date();

  /**
   * Varmistaa peruutuksen käyttäjältä ja käynnistää peruutusmutaation.
   */
  const handleCancel = (reservation: Reservation) => {
    if (!confirm(t('myBookings.cancelConfirm'))) {
      return;
    }

    cancelMutation.mutate({
      id: reservation.id,
      req: { userId: user.id, reason: 'Käyttäjän itsensä peruma' },
    });
  };

  /**
   * Varmistaa kesken lopettamisen käyttäjältä ja käynnistää lopetusmutaation.
   */
  const handleEndEarly = (reservation: Reservation) => {
    if (
      !confirm(
        lang === 'en'
          ? 'End this active reservation now and free the station?'
          : 'Lopetetaanko käynnissä oleva varaus nyt ja vapautetaan laite?'
      )
    ) {
      return;
    }

    endMutation.mutate({
      id: reservation.id,
      req: { userId: user.id },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#3F444E] pb-4">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#F4F4F5]">
            {t('myBookings.title')}
          </h2>
          <p className="text-sm text-[#A1A1AA]">
            {t('myBookings.desc')}
          </p>
        </div>
        <Button
          type="button"
          variant="xamk"
          className="min-h-[44px] w-full sm:w-auto shrink-0"
          onClick={() => setActiveTab('book')}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>{lang === 'en' ? 'Back to Book station' : 'Takaisin: Varaa laite'}</span>
        </Button>
      </div>

      {cancelError && (
        <div className="rounded-none bg-[#121417] border-2 border-[#EF4444] shadow-[4px_4px_0px_#000000] p-3 text-sm font-mono font-bold text-[#EF4444]">
          {cancelError}
        </div>
      )}

      {statusMessage && (
        <div className="rounded-none bg-[#121417] border-2 border-[#22C55E] shadow-[4px_4px_0px_#000000] p-3 text-sm font-mono font-bold text-[#22C55E]">
          {statusMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-none bg-[#1C1F24] text-[#A1A1AA] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 text-center font-mono font-bold text-sm uppercase tracking-wider">
          {t('booking.checkingAvailable')}
        </div>
      ) : myBookings.length === 0 ? (
        <div className="rounded-none bg-[#1C1F24] text-[#A1A1AA] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-8 text-center font-mono font-bold text-sm">
          <p>{t('myBookings.noneActive')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.map((booking) => {
            const start = new Date(booking.startUtc);
            const end = new Date(booking.endUtc);
            // Tarkistetaan onko varaus jo alkanut, käynnissä vai päättynyt
            const hasStarted = now >= start;
            const isOngoing = now > start && now < end;
            const hasEnded = now >= end;
            const station = stations?.find((s) => s.id === booking.gamingStationId);

            return (
              <div
                key={booking.id}
                className={`rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  booking.status === 'Cancelled' ? 'opacity-65' : ''
                }`}
              >
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold uppercase tracking-tight text-base text-[#F4F4F5] inline-flex items-center gap-2">
                      {booking.reservationType === 'Individual' ? (
                        <>
                          <Gamepad2 className="w-4 h-4 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                          <span>{station?.name || 'PC tai konsoli'}</span>
                        </>
                      ) : booking.reservationType === 'Room' ? (
                        <>
                          <Building2 className="w-4 h-4 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                          <span>{t('booking.type.room')}</span>
                        </>
                      ) : (
                        <>
                          <Trophy className="w-4 h-4 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                          <span>{t('booking.type.event')}</span>
                        </>
                      )}
                    </span>
                    <Badge
                      variant={booking.status === 'Active' ? 'success' : 'destructive'}
                      className="rounded-none font-mono font-bold text-xs uppercase"
                    >
                      {booking.status === 'Active' ? (lang === 'en' ? 'Active' : 'Aktiivinen') : (lang === 'en' ? 'Cancelled' : 'Peruttu')}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm font-mono font-bold text-[#A1A1AA]">
                    <span className="inline-flex items-center gap-1.5 text-[#F4F4F5]">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                      <span>
                        {start.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#FACC15]">
                      <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      <span>
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </div>

                  {booking.cancellationReason && (
                    <div className="rounded-none bg-[#121417] border border-[#EF4444] px-3 py-1.5 text-xs font-mono font-bold text-[#EF4444]">
                      Syy: {booking.cancellationReason}
                    </div>
                  )}
                </div>

                {booking.status === 'Active' && (
                  <div className="flex sm:flex-col items-stretch sm:items-end justify-end shrink-0">
                    {isOngoing ? (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="min-h-[44px] px-4 rounded-none font-mono font-bold uppercase"
                        onClick={() => handleEndEarly(booking)}
                        disabled={endMutation.isPending}
                        title={lang === 'en' ? 'End booking' : 'Lopeta varaus'}
                      >
                        {endMutation.isPending ? '...' : (lang === 'en' ? 'End booking' : 'Lopeta varaus')}
                      </Button>
                    ) : hasEnded ? (
                      <Badge
                        variant="secondary"
                        className="rounded-none font-mono font-bold text-xs uppercase"
                      >
                        {lang === 'en' ? 'Ended' : 'Päättynyt'}
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="min-h-[44px] px-4 rounded-none font-mono font-bold uppercase"
                        onClick={() => handleCancel(booking)}
                        disabled={hasStarted || cancelMutation.isPending}
                        title={hasStarted ? 'Alkanutta varausta ei voi perua' : t('myBookings.cancel')}
                      >
                        {hasStarted ? (lang === 'en' ? 'In progress' : 'Käynnissä') : (cancelMutation.isPending ? t('myBookings.cancelling') : t('myBookings.cancel'))}
                      </Button>
                    )}
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
