/**
 * @file AdminStatisticsView.tsx
 * @description Ylläpitopaneelin tilasto- ja käyttöastenäkymä.
 * Näyttää 4 keskeistä tunnuslukua, pelipistekohtaisen käyttöasteen palkkeina
 * sekä varausten jakauman tyypeittäin.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Users,
  Gamepad2,
  BarChart3,
  Monitor,
  ClipboardList,
  Building2,
  Trophy,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Tilastojen ja käyttöasteen näkymä ylläpitopaneelissa.
 */
export const AdminStatisticsView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  const { data: statistics } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.getStatistics(),
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-none bg-[#1C1F24] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] p-4 sm:p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              {isEn ? 'Total reservations' : 'Kokonaisvaraukset'}
            </span>
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#121417] border border-[#3F444E] text-[#FACC15]"
              aria-hidden="true"
            >
              <Calendar className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#F4F4F5] leading-none">
            {statistics?.totalReservations ?? 0}
          </div>
          <div className="font-mono text-xs font-bold text-[#9CA3AF]">
            {isEn ? 'All recorded bookings' : 'Kaikki järjestelmän varaukset'}
          </div>
        </div>

        <div className="rounded-none bg-[#1C1F24] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] p-4 sm:p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              {isEn ? 'Active reservations' : 'Aktiiviset varaukset'}
            </span>
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#121417] border border-[#3F444E] text-[#22C55E]"
              aria-hidden="true"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#F4F4F5] leading-none">
            {statistics?.activeReservations ?? 0}
          </div>
          <div className="font-mono text-xs font-bold text-[#9CA3AF]">
            {isEn ? 'Upcoming and ongoing sessions' : 'Voimassa olevat varaukset'}
          </div>
        </div>

        <div className="rounded-none bg-[#1C1F24] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] p-4 sm:p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              {isEn ? 'Total users' : 'Käyttäjämäärä'}
            </span>
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#121417] border border-[#3F444E] text-[#3B82F6]"
              aria-hidden="true"
            >
              <Users className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#F4F4F5] leading-none">
            {statistics?.totalUsers ?? 0}
          </div>
          <div className="font-mono text-xs font-bold text-[#9CA3AF]">
            {isEn ? 'Verified Xamk accounts' : 'Vahvistetut Xamk-tunnukset'}
          </div>
        </div>

        <div className="rounded-none bg-[#1C1F24] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] p-4 sm:p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              {isEn ? 'Catalog games' : 'Asennetut pelit'}
            </span>
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#121417] border border-[#3F444E] text-[#FACC15]"
              aria-hidden="true"
            >
              <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#F4F4F5] leading-none">
            {statistics?.totalGames ?? 0}
          </div>
          <div className="font-mono text-xs font-bold text-[#9CA3AF]">
            {isEn ? 'Available across PC, PS5, and Switch' : 'PC-, PS5- ja Switch-pelit'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <BarChart3 className="w-5 h-5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
              <span>
                {isEn ? 'Station utilization and hours' : 'Pelipisteiden käyttöaste ja varausmäärät'}
              </span>
            </CardTitle>
            <div className="w-12 h-1 bg-[#FACC15] my-1" />
          </CardHeader>
          <div className="flex flex-col gap-3.5 mt-1.5">
            {statistics?.stationUsage?.map((st) => (
              <div key={st.stationId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5] inline-flex items-center gap-1.5">
                    {st.stationType === 'PC' ? (
                      <Monitor className="w-4 h-4 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <Gamepad2 className="w-4 h-4 shrink-0 text-[#3B82F6]" strokeWidth={2.5} aria-hidden="true" />
                    )}
                    <span>{st.stationName}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#9CA3AF]">
                    {st.reservationCount} {isEn ? 'bookings' : 'varausta'}, {st.totalHours}{' '}
                    {isEn ? 'hours' : 'tuntia'}
                  </span>
                </div>
                <div className="w-full h-3 rounded-none bg-[#121417] border-2 border-black overflow-hidden">
                  <div
                    className="h-full bg-[#FACC15]"
                    style={{
                      width: `${Math.min(
                        100,
                        (st.reservationCount / Math.max(1, statistics.totalReservations)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <ClipboardList className="w-5 h-5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
              <span>
                {isEn ? 'Reservations by type' : 'Varausten jakautuminen tyypeittäin'}
              </span>
            </CardTitle>
            <div className="w-12 h-1 bg-[#FACC15] my-1" />
          </CardHeader>
          <div className="grid grid-cols-1 gap-3 mt-1.5">
            {statistics?.typeBreakdown?.map((tb) => (
              <div
                key={tb.reservationType}
                className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#1C1F24] border border-[#3F444E] text-[#FACC15] shrink-0"
                    aria-hidden="true"
                  >
                    {tb.reservationType === 'Individual' ? (
                      <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    ) : tb.reservationType === 'Room' ? (
                      <Building2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <Trophy className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </span>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                    {tb.reservationType === 'Individual'
                      ? isEn
                        ? 'Single station'
                        : 'Yksittäisvaraukset'
                      : tb.reservationType === 'Room'
                      ? isEn
                        ? 'Whole room'
                        : 'Tilavaraukset'
                      : isEn
                      ? 'Events'
                      : 'Tapahtumat'}
                  </span>
                </div>
                <Badge variant="status">{`${tb.count} ${isEn ? 'PCS' : 'KPL'}`}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
