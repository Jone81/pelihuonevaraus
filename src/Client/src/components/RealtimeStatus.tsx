/**
 * @file RealtimeStatus.tsx
 * @description Pelihuoneen reaaliaikainen tilannetaulu (Live Status) ja laitekohtainen päiväkatsaus.
 * Näyttää kunkin pelipisteen nykyisen saatavuuden seuraavalle tunnille, konsolikaapin yhteisen
 * television (SharedTV) lukitustilan sekä interaktiivisen `DailyScheduleViewer`-päiväkalenterin.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Monitor,
  Gamepad2,
  Calendar,
  Lock,
  Tv,
  Building2,
  Map,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { DailyScheduleViewer } from './DailyScheduleViewer';
import { Button } from '@/components/ui/button';
import type { GamingStation } from '../types';

/**
 * RealtimeStatus-komponentin ominaisuudet (props).
 */
interface RealtimeStatusProps {
  /** Valinnainen funktio pohjakuvamodaalin avaamiseen */
  onOpenFloorPlan?: () => void;
  /** Valinnainen funktio, jolla siirrytään suoraan varausnäkymään valitulla ajalla/laitteella */
  onNavigateToBooking?: (stationId?: string, startHour?: string, endHour?: string) => void;
}

/**
 * Reaaliaikaisen tilanteen ja päiväaikataulun näyttävä komponentti.
 */
export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  onOpenFloorPlan,
  onNavigateToBooking,
}) => {
  const { t } = useLanguage();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isToday = selectedDate === todayStr;

  // Haetaan kaikki tilan pelipisteet
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

  // Haetaan kuluvan tunnin aktiiviset varaukset mahdollisten tilavarausten tunnistamiseksi
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

  // Tarkistetaan onko koko tila varattu juuri nyt
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

  /**
   * Apufunktio laitekohtaisten päivävarausten (suorat varaukset, tilavaraukset, SharedTV-lukot) hakemiseen.
   */
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
        time: `${formatTime(r.startUtc)}-${formatTime(r.endUtc)}`,
        booker: r.bookerName || 'Opiskelija',
      })),
      room: room.map((r) => ({
        time: `${formatTime(r.startUtc)}-${formatTime(r.endUtc)}`,
        type: r.reservationType,
        booker: r.bookerName || 'Tila varattu',
      })),
      tvLocked: tvConflict.map((r) => ({
        time: `${formatTime(r.startUtc)}-${formatTime(r.endUtc)}`,
      })),
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b-2 border-[#3F444E] pb-4">
        <div>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#F4F4F5]">
            {t('status.title')}
          </h2>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {t('status.desc')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {onOpenFloorPlan && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-[44px] rounded-none font-mono font-bold flex items-center gap-1.5"
              onClick={onOpenFloorPlan}
            >
              <Map className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{t('booking.openFloorPlan')}</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] rounded-none font-mono font-bold flex items-center gap-1.5"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span>{t('status.refresh')}</span>
          </Button>
        </div>
      </div>

      {activeRoomReservation && (
        <div
          className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#EF4444] shadow-[4px_4px_0px_#000000] p-4 text-sm"
          role="alert"
        >
          <strong className="font-mono font-bold text-[#EF4444]">
            {t('status.roomBookedNow')},{' '}
            {activeRoomReservation.reservationType === 'Event'
              ? t('booking.type.event')
              : t('booking.type.room')}
            .
          </strong>{' '}
          {activeRoomReservation.bookerName ? (
            <>
              {t('status.booker')}{' '}
              <strong className="font-mono font-bold text-[#F4F4F5]">
                {activeRoomReservation.bookerName}
              </strong>{' '}
              {activeRoomReservation.bookerEmail && (
                <a
                  href={`mailto:${activeRoomReservation.bookerEmail}`}
                  className="underline font-mono font-bold text-[#FACC15] hover:text-white"
                >
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
        <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3B82F6] shadow-[4px_4px_0px_#000000] p-4 text-sm font-mono font-bold">
          {t('status.sharedTvInUse')}
        </div>
      )}

      {/* Pikalaitelaatikot (Live status + päivän varaukset) */}
      {loadingStations || loadingAvailable ? (
        <div className="rounded-none bg-[#1C1F24] text-[#A1A1AA] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 text-center font-mono font-bold text-sm uppercase tracking-wider">
          {t('booking.checkingAvailable')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations?.map((station) => {
            const isAvailable = availableIds.has(station.id);
            const isTvLocked = station.usesSharedTv && isSharedTvInUse && !isAvailable;
            const summary = getStationBookingsSummary(station);
            const hasBookingsToday = summary && (summary.direct.length > 0 || summary.room.length > 0 || summary.tvLocked.length > 0);

            return (
              <div
                key={station.id}
                className={`rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 shadow-[4px_4px_0px_#000000] p-4 flex flex-col justify-between gap-4 ${
                  isAvailable ? 'border-[#22C55E]' : 'border-[#EF4444]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-[#121417] border-2 border-[#3F444E] text-[#FACC15]"
                      aria-hidden="true"
                    >
                      {station.type === 'PC' ? (
                        <Monitor className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        <Gamepad2 className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-extrabold uppercase tracking-tight text-base text-[#F4F4F5] truncate">
                        {station.name}
                      </h3>
                      <span className="block font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA]">
                        {station.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                    {station.usesSharedTv && (
                      <span className="rounded-none bg-[#3B82F6] text-white border border-black px-2 py-0.5 text-xs font-mono font-bold uppercase flex items-center gap-1">
                        <Tv className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                        <span>{t('booking.sharedTvBadge')}</span>
                      </span>
                    )}
                    <span
                      className={`rounded-none border-2 border-black px-2.5 py-0.5 text-xs font-mono font-bold uppercase ${
                        isToday
                          ? isAvailable
                            ? 'bg-[#22C55E] text-[#09090B]'
                            : isTvLocked
                            ? 'bg-[#EF4444] text-white'
                            : 'bg-[#EF4444] text-white'
                          : hasBookingsToday
                          ? 'bg-[#EF4444] text-white'
                          : 'bg-[#22C55E] text-[#09090B]'
                      }`}
                    >
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
                <div className="pt-3 border-t border-[#3F444E] space-y-2">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isToday ? t('schedule.today') : selectedDate}:</span>
                  </div>
                  {hasBookingsToday ? (
                    <div className="flex flex-wrap gap-1.5">
                      {summary.direct.map((b, idx) => (
                        <span
                          key={`dir-${idx}`}
                          className="rounded-none bg-[#121417] border border-[#EF4444] text-[#EF4444] px-2 py-0.5 text-xs font-mono font-bold inline-flex items-center gap-1"
                          title={`Varaaja: ${b.booker}`}
                        >
                          <Lock className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          <span>{b.time} ({b.booker})</span>
                        </span>
                      ))}
                      {summary.tvLocked.map((tv, idx) => (
                        <span
                          key={`tv-${idx}`}
                          className="rounded-none bg-[#121417] border border-[#3B82F6] text-[#3B82F6] px-2 py-0.5 text-xs font-mono font-bold inline-flex items-center gap-1"
                          title="TV käytössä toisella konsolilla"
                        >
                          <Tv className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          <span>{tv.time} TV</span>
                        </span>
                      ))}
                      {summary.room.map((rm, idx) => (
                        <span
                          key={`rm-${idx}`}
                          className="rounded-none bg-[#121417] border border-[#FACC15] text-[#FACC15] px-2 py-0.5 text-xs font-mono font-bold inline-flex items-center gap-1"
                          title={`Koko tila: ${rm.booker}`}
                        >
                          <Building2 className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          <span>{rm.time} {rm.type}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-bold text-[#22C55E] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      <span>{t('schedule.freeAllDay')}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Päiväkalenteri (Interaktiivinen aikajana) */}
      <div className="mt-8">
        <DailyScheduleViewer
          selectedDate={selectedDate}
          onDateChange={(newDate) => setSelectedDate(newDate)}
          onSelectSlot={(stationId, startH, endH) => {
            if (onNavigateToBooking) {
              onNavigateToBooking(stationId, startH, endH);
            }
          }}
          showDateSelector={true}
        />
      </div>
    </div>
  );
};
