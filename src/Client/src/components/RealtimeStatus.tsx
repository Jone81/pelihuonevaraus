import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { DailyScheduleViewer } from './DailyScheduleViewer';
import {
  Activity,
  RotateCw,
  Map,
  Monitor,
  Gamepad2,
  Gamepad,
  Tv,
  Building,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import type { GamingStation } from '../types';

interface RealtimeStatusProps {
  onOpenFloorPlan?: () => void;
  onNavigateToBooking?: (stationId?: string, startHour?: string, endHour?: string) => void;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  onOpenFloorPlan,
  onNavigateToBooking,
}) => {
  const { t, lang } = useLanguage();
  const isEn = lang === 'en';
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isToday = selectedDate === todayStr;

  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  const { data: availableStations, isLoading: loadingAvailable, refetch, isFetching } = useQuery({
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

  const ps5 = stations?.find((s) => s.type === 'PlayStation5');
  const switchSt = stations?.find((s) => s.type === 'NintendoSwitch');

  const ps5Available = ps5 ? availableIds.has(ps5.id) : false;
  const switchAvailable = switchSt ? availableIds.has(switchSt.id) : false;

  const isSharedTvInUse = ps5 && switchSt && (!ps5Available || !switchAvailable);

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

  const getStationIcon = (type: string) => {
    if (type === 'PlayStation5') return <Gamepad2 className="w-4 h-4 text-purple-400" />;
    if (type === 'NintendoSwitch' || type === 'Switch') return <Gamepad className="w-4 h-4 text-rose-400" />;
    return <Monitor className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="w-full max-w-full flex flex-col gap-6">
      {/* Yläkortti: Otsikko & Hallintapainikkeet */}
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white font-sans">
              {t('status.title')}
            </h2>
          </div>
          <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
          <p className="text-xs text-gray-400 mt-2">{t('status.desc')}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onOpenFloorPlan && (
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-[#111318] hover:bg-[#1a1d26] border border-[#2d323f] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              onClick={onOpenFloorPlan}
            >
              <Map className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('booking.openFloorPlan')}</span>
            </button>
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

      {/* Huomautusbannereita jos koko tila varattu tai TV käytössä */}
      {activeRoomReservation && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 shadow-lg" role="alert">
          <Building className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white font-bold">
              {t('status.roomBookedNow')} ({activeRoomReservation.reservationType === 'Event' ? t('booking.type.event') : t('booking.type.room')}):
            </strong>{' '}
            {activeRoomReservation.bookerName ? (
              <>
                {t('status.booker')} <strong>{activeRoomReservation.bookerName}</strong>{' '}
                {activeRoomReservation.bookerEmail && (
                  <a href={`mailto:${activeRoomReservation.bookerEmail}`} className="text-amber-400 hover:underline">
                    ({activeRoomReservation.bookerEmail})
                  </a>
                )}. {t('booking.contactBooker')}
              </>
            ) : (
              'Tila on varattu ryhmäkäyttöön.'
            )}
          </div>
        </div>
      )}

      {isSharedTvInUse && (
        <div className="p-4 rounded-2xl bg-[#d89619]/10 border border-[#d89619]/30 text-[#fbba18] text-xs flex items-center gap-2.5 shadow-lg">
          <Tv className="w-4 h-4 flex-shrink-0" />
          <span>{t('status.sharedTvInUse')}</span>
        </div>
      )}

      {/* Laiteruudukko (8 kpl pelipisteitä) */}
      {loadingStations || loadingAvailable ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400 bg-[#181a20] rounded-2xl border border-[#2d323f]">
          <div className="w-6 h-6 border-2 border-[#d89619] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">{t('booking.checkingAvailable')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations?.map((station) => {
            const isAvailable = availableIds.has(station.id);
            const isTvLocked = station.usesSharedTv && isSharedTvInUse && !isAvailable;
            const summary = getStationBookingsSummary(station);
            const hasBookingsToday = summary && (summary.direct.length > 0 || summary.room.length > 0 || summary.tvLocked.length > 0);

            const isPs5 = station.type === 'PlayStation5';
            const isSwitch = station.type === 'NintendoSwitch' || station.type === 'Switch';
            const subtitle = isPs5 ? 'PS5 • 4K TV' : isSwitch ? 'Switch • 4K TV' : 'PC';

            return (
              <div
                key={station.id}
                className={`bg-[#181a20] border rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-3 transition-all ${
                  isAvailable
                    ? 'border-[#2d323f] hover:border-emerald-500/40'
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                {/* Ylärivi: Ikoni, Nimi ja Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        isPs5
                          ? 'bg-purple-500/15'
                          : isSwitch
                          ? 'bg-rose-500/15'
                          : 'bg-cyan-500/15'
                      }`}
                    >
                      {getStationIcon(station.type)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-white font-bold text-xs truncate">{station.name}</h3>
                      <span className="text-gray-400 text-[10px] truncate">{subtitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {station.usesSharedTv && (
                      <span className="text-[9px] font-bold text-[#d89619] bg-[#d89619]/15 border border-[#d89619]/30 px-1 py-0.5 rounded">
                        TV
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isTvLocked
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isAvailable
                        ? t('status.free')
                        : isTvLocked
                        ? 'TV ' + t('status.busy')
                        : t('status.busy')}
                    </span>
                  </div>
                </div>

                {/* Päivän varaukset tälle laitteelle */}
                <div className="pt-2 border-t border-[#252936] flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>{isToday ? t('schedule.today') : selectedDate}</span>
                    {onNavigateToBooking && isAvailable && (
                      <button
                        type="button"
                        className="text-[#fbba18] hover:underline font-bold cursor-pointer"
                        onClick={() => onNavigateToBooking(station.id)}
                      >
                        {isEn ? 'Book →' : 'Varaa →'}
                      </button>
                    )}
                  </div>

                  {hasBookingsToday ? (
                    <div className="flex flex-wrap gap-1">
                      {summary.direct.map((b, idx) => (
                        <span
                          key={`dir-${idx}`}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1"
                          title={`Varaaja: ${b.booker}`}
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>{b.time}</span>
                        </span>
                      ))}
                      {summary.tvLocked.map((tv, idx) => (
                        <span
                          key={`tv-${idx}`}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1"
                          title="TV käytössä toisella konsolilla"
                        >
                          <Tv className="w-2.5 h-2.5" />
                          <span>{tv.time}</span>
                        </span>
                      ))}
                      {summary.room.map((rm, idx) => (
                        <span
                          key={`rm-${idx}`}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1"
                          title={`Koko tila: ${rm.booker}`}
                        >
                          <Building className="w-2.5 h-2.5" />
                          <span>{rm.time}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('schedule.freeAllDay')}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Päivän aikataulunäkymä alakorttina (Lukittu puhtaaseen Timeline-aikajanamatriisiin ilman tuplakortteja) */}
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 md:p-7 shadow-xl">
        <DailyScheduleViewer
          selectedDate={selectedDate}
          onDateChange={(newDate) => setSelectedDate(newDate)}
          onSelectSlot={(stationId, startH, endH) => {
            if (onNavigateToBooking) {
              onNavigateToBooking(stationId, startH, endH);
            }
          }}
          showDateSelector={true}
          lockViewMode="timeline"
        />
      </div>
    </div>
  );
};
