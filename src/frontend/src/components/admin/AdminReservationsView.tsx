/**
 * @file AdminReservationsView.tsx
 * @description Ylläpitopaneelin varausnäkymä seuraavan 14 vuorokauden aktiivisten
 * varausten tarkasteluun, suodattamiseen ja ylläpitäjän tekemään peruutukseen.
 */
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

/**
 * AdminReservationsView-komponentin ominaisuudet.
 */
export interface AdminReservationsViewProps {
  /** Callback onnistumisviestin näyttämiseen */
  onStatus: (msg: string | null) => void;
  /** Callback virheviestin näyttämiseen */
  onError: (msg: string | null) => void;
}

/**
 * Ylläpitäjän aktiivisten varausten hallintanäkymä (seuraavat 14 vrk).
 */
export const AdminReservationsView: React.FC<AdminReservationsViewProps> = ({
  onStatus,
  onError,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');

  const { data: adminStations } = useQuery({
    queryKey: ['admin-stations'],
    queryFn: () => api.getAllStationsForAdmin(),
    enabled: isAdmin,
  });

  const { data: upcomingReservations } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => {
      const start = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      return api.getActiveReservations(start, end);
    },
    enabled: isAdmin,
  });

  // Peruuta yksittäinen varaus ylläpitäjän toimesta
  const adminCancelReservationMutation = useMutation({
    mutationFn: (reservationId: string) =>
      api.cancelReservation(reservationId, {
        userId: user?.id ?? '',
        reason: isEn ? 'Cancelled by administrator' : 'Ylläpitäjän peruuttama varaus',
      }),
    onSuccess: () => {
      onStatus(
        isEn ? 'Reservation cancelled by administrator.' : 'Varaus peruutettu ylläpitäjän toimesta.'
      );
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-day'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to cancel reservation.'
          : 'Varauksen peruutus epäonnistui.'
      );
    },
  });

  const filteredReservations = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = upcomingReservations ?? [];
    if (!q) return list;
    return list.filter((r) => {
      const stationName =
        (adminStations ?? []).find((s) => s.id === r.gamingStationId)?.name ?? r.reservationType;
      return (
        stationName.toLowerCase().includes(q) ||
        (r.bookerName ?? '').toLowerCase().includes(q) ||
        (r.bookerEmail ?? '').toLowerCase().includes(q)
      );
    });
  }, [upcomingReservations, adminStations, search]);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <CardHeader className="p-0">
          <CardTitle className="inline-flex items-center gap-2">
            <ClipboardList className="w-5 h-5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
            <span>
              {isEn
                ? 'Active reservations, next 14 days'
                : 'Voimassa olevat varaukset, seuraavat 14 vrk'}
            </span>
          </CardTitle>
          <div className="w-12 h-1 bg-[#FACC15] my-1" />
          <CardDescription>
            {isEn
              ? 'Review upcoming student and room reservations and cancel bookings if needed due to schedule changes or device maintenance.'
              : 'Tarkastele tulevia aktiivisia varauksia ja peruuta yksittäinen varaus tarvittaessa esimerkiksi laitehuollon tai opiskelijan pyynnön vuoksi.'}
          </CardDescription>
        </CardHeader>

        <div className="w-full sm:w-auto sm:min-w-[280px]">
          <Input
            type="text"
            placeholder={
              isEn ? 'Search by booker, email, or station...' : 'Hae varaajaa, sähköpostia tai laitetta...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-8 text-center font-mono text-sm font-bold text-[#9CA3AF]">
          {isEn
            ? 'No active reservations found for the next 14 days.'
            : 'Ei aktiivisia varauksia seuraavan 14 vuorokauden aikana.'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isEn ? 'Time window' : 'Ajankohta'}</TableHead>
              <TableHead>{isEn ? 'Target and type' : 'Kohde ja tyyppi'}</TableHead>
              <TableHead>{isEn ? 'Booked by' : 'Varaaja'}</TableHead>
              <TableHead>{isEn ? 'Action' : 'Toiminto'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservations.map((r) => {
              const stName =
                (adminStations ?? []).find((s) => s.id === r.gamingStationId)?.name ??
                (r.reservationType === 'Room'
                  ? isEn
                    ? 'Full Game Room'
                    : 'Koko pelitila'
                  : r.reservationType === 'Event'
                  ? isEn
                    ? 'Official event'
                    : 'Tapahtuma tai turnaus'
                  : r.reservationType);
              const startD = new Date(r.startUtc);
              const endD = new Date(r.endUtc);

              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong className="font-mono font-bold text-[#F4F4F5]">
                      {startD.toLocaleDateString('fi-FI')}
                    </strong>{' '}
                    <span className="font-mono text-xs text-[#9CA3AF]">
                      {startD.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}-
                      {endD.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="status">{stName}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-[#F4F4F5]">
                      {r.bookerName || (isEn ? 'Student' : 'Opiskelija')}
                    </div>
                    {r.bookerEmail && (
                      <div className="font-mono text-xs text-[#9CA3AF]">{r.bookerEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={adminCancelReservationMutation.isPending}
                      onClick={() => adminCancelReservationMutation.mutate(r.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      <span>{isEn ? 'Cancel' : 'Peru varaus'}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};
