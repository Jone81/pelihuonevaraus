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
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Reservation } from '../../types';

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
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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
    mutationFn: ({ reservationId, reason }: { reservationId: string; reason: string }) =>
      api.cancelReservation(reservationId, {
        userId: user?.id ?? '',
        reason:
          reason.trim() ||
          (isEn ? 'Cancelled by administrator' : 'Ylläpitäjän peruuttama varaus'),
      }),
    onSuccess: () => {
      onStatus(
        isEn ? 'Reservation cancelled by administrator.' : 'Varaus peruutettu ylläpitäjän toimesta.'
      );
      onError(null);
      setCancelTarget(null);
      setCancelReason('');
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

  const handleOpenCancelModal = (reservation: Reservation) => {
    setCancelTarget(reservation);
    setCancelReason(
      isEn ? 'Device maintenance or schedule change' : 'Laitehuolto tai aikataulumuutos'
    );
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;
    adminCancelReservationMutation.mutate({
      reservationId: cancelTarget.id,
      reason: cancelReason,
    });
  };

  const resolveTargetLabel = (reservation: Reservation): string =>
    (adminStations ?? []).find((s) => s.id === reservation.gamingStationId)?.name ??
    (reservation.reservationType === 'Room'
      ? isEn
        ? 'Full Game Room'
        : 'Koko pelitila'
      : reservation.reservationType === 'Event'
      ? isEn
        ? 'Official event'
        : 'Tapahtuma tai turnaus'
      : reservation.reservationType);

  return (
    <>
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
                const stName = resolveTargetLabel(r);
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
                        onClick={() => handleOpenCancelModal(r)}
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

      {/* Varauksen peruutusmodaali */}
      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent>
          {cancelTarget && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isEn ? 'Cancel user reservation' : 'Peruuta käyttäjän varaus'}
                </DialogTitle>
                <div className="w-12 h-1 bg-[#EF4444]" />
                <DialogDescription>
                  {isEn
                    ? 'Cancel the selected booking due to hardware maintenance or a student request.'
                    : 'Peruuta valittu varaus esimerkiksi laitehuollon tai opiskelijan pyynnön vuoksi.'}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 space-y-1">
                <div className="font-mono text-xs font-extrabold uppercase text-[#FACC15]">
                  {resolveTargetLabel(cancelTarget)} —{' '}
                  {new Date(cancelTarget.startUtc).toLocaleDateString('fi-FI')}{' '}
                  {isEn ? 'at ' : 'klo '}
                  {new Date(cancelTarget.startUtc).toLocaleTimeString('fi-FI', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  -
                  {new Date(cancelTarget.endUtc).toLocaleTimeString('fi-FI', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="font-mono text-xs text-[#D1D5DB]">
                  {isEn ? 'Booked by:' : 'Varaaja:'}{' '}
                  {cancelTarget.bookerName || (isEn ? 'Student' : 'Opiskelija')}
                  {cancelTarget.bookerEmail ? ` (${cancelTarget.bookerEmail})` : ''}
                </div>
              </div>

              <form onSubmit={handleConfirmCancel} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="admin-cancel-reason">
                    {isEn ? 'Cancellation reason *' : 'Peruutuksen syy *'}
                  </Label>
                  <Input
                    id="admin-cancel-reason"
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    disabled={adminCancelReservationMutation.isPending}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCancelTarget(null)}
                    disabled={adminCancelReservationMutation.isPending}
                  >
                    {isEn ? 'Back' : 'Takaisin'}
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={
                      adminCancelReservationMutation.isPending || !cancelReason.trim()
                    }
                  >
                    {isEn ? 'Confirm cancellation' : 'Vahvista peruutus'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
