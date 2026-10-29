import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CreateReservationRequest, GamingStation, ReservationType } from '../types';

interface BookingCalendarProps {
  onRequireLogin: () => void;
  onSuccessBooking: () => void;
  onOpenFloorPlan: () => void;
  onNavigateMyBookings?: () => void;
}

const DISPLAY_ORDER = [
  'Nintendo Switch',
  'PC 1',
  'PC 2',
  'PC 3',
  'PC 4',
  'PC 5',
  'PC 6',
  'PlayStation 5',
];

const MATRIX_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const StationIcon: React.FC<{ type: string; name: string }> = ({ type, name }) => {
  if (type === 'NintendoSwitch' || name.includes('Switch')) {
    return (
      <span className="station-svg-icon icon-switch" aria-hidden="true">
        🕹️
      </span>
    );
  }
  if (type === 'PlayStation5' || name.includes('PlayStation')) {
    return (
      <span className="station-svg-icon icon-ps5" aria-hidden="true">
        🎮
      </span>
    );
  }
  return (
    <span className="station-svg-icon icon-pc" aria-hidden="true">
      🖥️
    </span>
  );
};

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  onRequireLogin,
  onSuccessBooking,
  onNavigateMyBookings,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

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
  const [startHour, setStartHour] = useState('08:00');
  const [endHour, setEndHour] = useState('10:00');
  const [reservationType, setReservationType] = useState<ReservationType>(1);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [dragSelection, setDragSelection] = useState<{
    stationId: string;
    anchorIndex: number;
    currentIndex: number;
  } | null>(null);
  const dragSelectionRef = useRef<typeof dragSelection>(null);
  const matrixWrapRef = useRef<HTMLDivElement>(null);

  const startDateTime = new Date(`${date}T${startHour}:00`);
  const endDateTime = new Date(`${date}T${endHour}:00`);
  const startUtc = startDateTime.toISOString();
  const endUtc = endDateTime.toISOString();

  const { data: allStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  const { data: availableStations } = useQuery({
    queryKey: ['available-stations', startUtc, endUtc],
    queryFn: () => api.getAvailableStations(startUtc, endUtc),
    enabled: endDateTime > startDateTime,
    refetchInterval: 15000,
  });

  const startDayUtc = new Date(`${date}T00:00:00`).toISOString();
  const endDayUtc = new Date(`${date}T23:59:59`).toISOString();

  const { data: dayReservations } = useQuery({
    queryKey: ['reservations-day', date],
    queryFn: () => api.getActiveReservations(startDayUtc, endDayUtc),
    refetchInterval: 15000,
  });

  const orderedStations = useMemo(() => {
    const source = allStations || [];
    return [...source].sort((a, b) => {
      const idxA = DISPLAY_ORDER.indexOf(a.name);
      const idxB = DISPLAY_ORDER.indexOf(b.name);
      const orderA = idxA === -1 ? 99 : idxA;
      const orderB = idxB === -1 ? 99 : idxB;
      return orderA - orderB;
    });
  }, [allStations]);

  const activeStation = useMemo(() => {
    if (selectedStationId) {
      const found = orderedStations.find((s) => s.id === selectedStationId);
      if (found) return found;
    }
    return orderedStations.find((s) => s.name === 'Nintendo Switch') || orderedStations[0];
  }, [orderedStations, selectedStationId]);

  const effectiveStationId = selectedStationId || activeStation?.id || '';

  const availableIdSet = useMemo(() => {
    if (!availableStations) return null;
    return new Set(availableStations.map((s) => s.id));
  }, [availableStations]);

  const isStationHourBusy = (station: GamingStation, hourStr: string): boolean => {
    if (!dayReservations || dayReservations.length === 0) return false;
    const h = parseInt(hourStr.split(':')[0], 10);
    const slotStartMin = h * 60;
    const slotEndMin = (h + 1) * 60;

    return dayReservations.some((r) => {
      const sDate = new Date(r.startUtc);
      const eDate = new Date(r.endUtc);
      const rStart = sDate.getHours() * 60 + sDate.getMinutes();
      const rEnd = eDate.getHours() * 60 + eDate.getMinutes();
      const overlaps = rStart < slotEndMin && rEnd > slotStartMin;
      if (!overlaps) return false;

      if (r.reservationType === 'Room' || r.reservationType === 'Event') return true;
      if (r.gamingStationId === station.id) return true;
      if (station.usesSharedTv && r.gamingStationId) {
        const other = orderedStations.find((st) => st.id === r.gamingStationId);
        if (other?.usesSharedTv) return true;
      }
      return false;
    });
  };

  const reservationMutation = useMutation({
    mutationFn: (req: CreateReservationRequest) => api.createReservation(req),
    onSuccess: () => {
      setConflictMessage(null);
      setGeneralError(null);
      setIdempotencyKey(
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-day'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      onSuccessBooking();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.problem?.status === 409) {
          setConflictMessage(
            '⚠️ 409 Ristiriita: Valittu pelipiste tai konsolien yhteinen TV ehdittiin varata toisen käyttäjän toimesta hetki sitten! Välimuisti on päivitetty, valitse toinen laite tai aikaväli.'
          );
          queryClient.invalidateQueries({ queryKey: ['available-stations'] });
          queryClient.invalidateQueries({ queryKey: ['available-now'] });
          queryClient.invalidateQueries({ queryKey: ['stations'] });
          queryClient.invalidateQueries({ queryKey: ['reservations-day'] });
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

    const selectedDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setGeneralError(
        isEn
          ? 'The Game Room is open Mon–Fri only. Please choose a weekday.'
          : 'Pelihuone on avoinna vain arkisin (ma–pe). Valitse arkipäivä.'
      );
      return;
    }

    if (endDateTime <= startDateTime) {
      setGeneralError('Loppuajan on oltava alkuajan jälkeen.');
      return;
    }

    if (startDateTime.getTime() < Date.now() - 5 * 60 * 1000) {
      setGeneralError(
        'Valittu alkamisaika on jo menneisyydessä. Valitse kuluvaa kellonaikaa myöhäisempi aika tai toinen päivä.'
      );
      return;
    }

    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      setGeneralError('Varauksen vähimmäiskesto on 30 minuuttia.');
      return;
    }

    const stationToBook = effectiveStationId;

    if (reservationType === 1) {
      if (!stationToBook) {
        setGeneralError('Valitse haluamasi pelipiste.');
        return;
      }
      if (durationMinutes > 240) {
        setGeneralError('Yksittäisvarauksen enimmäiskesto on 4 tuntia.');
        return;
      }
    } else {
      if (!isAdmin && durationMinutes > 240) {
        setGeneralError(
          'Opiskelijan tilavarauksen enimmäiskesto on 4 tuntia. Pidemmät varaukset vaativat Admin-oikeudet.'
        );
        return;
      }
      if (durationMinutes > 600) {
        setGeneralError('Tilavarauksen enimmäiskesto on 10 tuntia (aukioloajan puitteissa).');
        return;
      }
    }

    const request: CreateReservationRequest = {
      idempotencyKey,
      userId: user.id,
      reservationType,
      gamingStationId: reservationType === 1 ? stationToBook : null,
      startUtc,
      endUtc,
    };

    reservationMutation.mutate(request);
  };

  const applyMatrixRange = useCallback((minIdx: number, maxIdx: number) => {
    const startH = MATRIX_HOURS[minIdx];
    const endHNum = Math.min(18, parseInt(MATRIX_HOURS[maxIdx].split(':')[0], 10) + 1);
    const endH = `${String(endHNum).padStart(2, '0')}:00`;
    setStartHour(startH);
    setEndHour(endH);
  }, []);

  const updateSelectionAtIndex = useCallback(
    (hourIdx: number) => {
      const currentDrag = dragSelectionRef.current;
      if (!currentDrag) return;
      const targetStation = orderedStations.find((s) => s.id === currentDrag.stationId);
      if (!targetStation) return;

      const { anchorIndex } = currentDrag;
      const step = hourIdx >= anchorIndex ? 1 : -1;
      const maxAllowedSpan = reservationType !== 1 && isAdmin ? 10 : 4;

      let clampedIdx = anchorIndex;
      for (
        let i = anchorIndex + step;
        step > 0 ? i <= hourIdx : i >= hourIdx;
        i += step
      ) {
        if (Math.abs(i - anchorIndex) + 1 > maxAllowedSpan) {
          break;
        }
        if (isStationHourBusy(targetStation, MATRIX_HOURS[i])) {
          break;
        }
        clampedIdx = i;
      }

      if (clampedIdx !== currentDrag.currentIndex) {
        const nextDrag = { ...currentDrag, currentIndex: clampedIdx };
        setDragSelection(nextDrag);
        dragSelectionRef.current = nextDrag;
      }

      const minIdx = Math.min(anchorIndex, clampedIdx);
      const maxIdx = Math.max(anchorIndex, clampedIdx);
      applyMatrixRange(minIdx, maxIdx);
    },
    [orderedStations, reservationType, isAdmin, applyMatrixRange]
  );

  const updateSelectionAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragSelectionRef.current) return;

      // Automaattinen vaakavieritys, jos sormi/kursori viedään lähelle taulukon reunaa
      if (matrixWrapRef.current) {
        const wrapRect = matrixWrapRef.current.getBoundingClientRect();
        const edgeThreshold = 36;
        if (clientX > wrapRect.right - edgeThreshold) {
          matrixWrapRef.current.scrollLeft += 10;
        } else if (clientX < wrapRect.left + edgeThreshold) {
          matrixWrapRef.current.scrollLeft -= 10;
        }
      }

      const el = document.elementFromPoint(clientX, clientY);
      const cell = el?.closest<HTMLElement>('.matrix-slot-td, .matrix-hour-th');
      if (!cell) return;

      const rawHourIdx = cell.getAttribute('data-hour-index');
      if (rawHourIdx === null) return;
      const hourIdx = parseInt(rawHourIdx, 10);
      if (!isNaN(hourIdx)) {
        updateSelectionAtIndex(hourIdx);
      }
    },
    [updateSelectionAtIndex]
  );

  const startDrag = useCallback(
    (station: GamingStation, hourIdx: number, busy: boolean) => {
      if (busy) return;
      setSelectedStationId(station.id);
      const newDrag = {
        stationId: station.id,
        anchorIndex: hourIdx,
        currentIndex: hourIdx,
      };
      setDragSelection(newDrag);
      dragSelectionRef.current = newDrag;
      applyMatrixRange(hourIdx, hourIdx);
    },
    [applyMatrixRange]
  );

  const stopDrag = useCallback(() => {
    setDragSelection(null);
    dragSelectionRef.current = null;
  }, []);

  useEffect(() => {
    if (!dragSelection) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateSelectionAtPoint(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        updateSelectionAtPoint(touch.clientX, touch.clientY);
      }
    };

    const handleEnd = () => {
      stopDrag();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [dragSelection, updateSelectionAtPoint, stopDrag]);

  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    station: GamingStation,
    hourIdx: number,
    busy: boolean
  ) => {
    if (busy) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedStationId(station.id);
      applyMatrixRange(hourIdx, hourIdx);
    }
  };

  const startMinutes = useMemo(() => {
    const [h, m] = startHour.split(':').map(Number);
    return h * 60 + (m || 0);
  }, [startHour]);

  const endMinutes = useMemo(() => {
    const [h, m] = endHour.split(':').map(Number);
    return h * 60 + (m || 0);
  }, [endHour]);

  return (
    <div className="xamk-booking-grid-layout">
      {/* LEFT COLUMN: Tee uusi varaus */}
      <section className="xamk-booking-left-col" aria-labelledby="heading-new-booking">
        <div className="xamk-section-heading">
          <h2 id="heading-new-booking">{t('booking.title')}</h2>
          <div className="xamk-heading-underline" />
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

        <form onSubmit={handleBooking} className="xamk-booking-form-clean">
          {/* Varaustyyppi (shadcn/ui Tabs 3-segment control) */}
          <div className="xamk-field-group">
            <Label>{t('booking.typeLabel')}</Label>
            <Tabs
              value={String(reservationType)}
              onValueChange={(val) => {
                if (val === 'my-bookings') {
                  onNavigateMyBookings?.();
                  return;
                }
                setReservationType(Number(val) as ReservationType);
              }}
            >
              <TabsList aria-label={t('booking.typeLabel')}>
                <TabsTrigger value="1">
                  {isEn ? 'Single Station' : 'Yksittäinen laite'}
                </TabsTrigger>
                <TabsTrigger value="2">
                  {isEn ? 'Whole Room' : 'Koko tila'}
                </TabsTrigger>
                {isAdmin ? (
                  <TabsTrigger value="3">
                    {isEn ? 'Event (Admin)' : 'Tapahtuma'}
                  </TabsTrigger>
                ) : (
                  <TabsTrigger value="my-bookings">
                    {isEn ? 'My Bookings' : 'Omat varaukset'}
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Row: Päivämäärä & Alkamisaika */}
          <div className="xamk-two-col-fields">
            <div className="xamk-field-group">
              <Label htmlFor="date">{t('booking.date')}</Label>
              <div className="xamk-gold-input-box">
                <input
                  id="date"
                  type="date"
                  className="xamk-clean-input btn-touch"
                  min={dateBounds.today}
                  max={dateBounds.maxDateStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="xamk-field-group">
              <Label htmlFor="startHour">{t('booking.startTime')}</Label>
              <div className="xamk-gold-input-box">
                <select
                  id="startHour"
                  className="xamk-clean-select btn-touch"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                >
                  {[
                    '08:00',
                    '08:30',
                    '09:00',
                    '09:30',
                    '10:00',
                    '10:30',
                    '11:00',
                    '11:30',
                    '12:00',
                    '12:30',
                    '13:00',
                    '13:30',
                    '14:00',
                    '14:30',
                    '15:00',
                    '15:30',
                    '16:00',
                    '16:30',
                    '17:00',
                    '17:30',
                  ].map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Päättymisaika & Pelipisteen valinta (Connected 2-tier gold-underlined box) */}
          <div className="xamk-field-group">
            <Label htmlFor="endHour">{t('booking.endTime')}</Label>
            <div className="xamk-double-gold-box">
              <div className="xamk-double-box-top">
                <select
                  id="endHour"
                  className="xamk-clean-select btn-touch"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                >
                  {[
                    '08:30',
                    '09:00',
                    '09:30',
                    '10:00',
                    '10:30',
                    '11:00',
                    '11:30',
                    '12:00',
                    '12:30',
                    '13:00',
                    '13:30',
                    '14:00',
                    '14:30',
                    '15:00',
                    '15:30',
                    '16:00',
                    '16:30',
                    '17:00',
                    '17:30',
                    '18:00',
                  ].map((time) => (
                    <option key={time} value={time}>
                      {isEn ? `End time ${time}` : `Päättymisaika ${time}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xamk-double-box-bottom">
                {reservationType === 1 ? (
                  <select
                    aria-label={t('booking.selectStation')}
                    className="xamk-clean-select xamk-sub-select btn-touch"
                    value={effectiveStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                  >
                    {orderedStations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({startHour}–{endHour})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="xamk-room-summary-line">
                    <span>
                      🏢 {reservationType === 2 ? t('booking.type.room') : t('booking.type.event')} ({startHour}–{endHour})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Pill Button (shadcn/ui Button) */}
          <div className="xamk-submit-row">
            <Button
              type="submit"
              variant="pill"
              disabled={reservationMutation.isPending || (reservationType === 1 && !effectiveStationId)}
            >
              <span>
                {reservationMutation.isPending
                  ? t('booking.processing')
                  : t('booking.submit')}
              </span>
              <span className="confirm-arrow" aria-hidden="true">→</span>
            </Button>
          </div>
        </form>
      </section>

      {/* RIGHT COLUMN: Päivän varaukset ja aikataulu */}
      <section className="xamk-booking-right-col" aria-labelledby="heading-day-schedule">
        <div className="xamk-section-heading">
          <h2 id="heading-day-schedule">{t('schedule.title')}</h2>
          <div className="xamk-heading-underline" />
        </div>

        <div className="xamk-schedule-sublabel-row">
          <span className="xamk-schedule-sublabel">
            {isEn ? 'Available TV & Station Schedule' : 'Aikataulu ja TV-varaukset'}
          </span>
          <span className="xamk-schedule-drag-hint hidden sm:inline">
            {isEn
              ? `Drag across hours to select time (max 4h) • ${startHour}–${endHour}`
              : `Maalaa aikaväli vetämällä (max 4 h) • ${startHour}–${endHour}`}
          </span>
          <span className="xamk-schedule-drag-hint sm:hidden text-[11px]">
            {isEn
              ? `👉 Drag slots to select (max 4h) • ${startHour}–${endHour}`
              : `👉 Valitse vetämällä sormella (max 4 h) • ${startHour}–${endHour}`}
          </span>
        </div>

        {/* All-Devices Hourly Matrix Table with Drag-to-Select */}
        <div
          ref={matrixWrapRef}
          className={`xamk-compact-matrix-wrap ${
            dragSelection ? 'matrix-is-dragging' : ''
          }`}
        >
          <table className="xamk-compact-matrix">
            <thead>
              <tr>
                <th className="matrix-station-th">{t('schedule.station')}</th>
                {MATRIX_HOURS.map((h, hourIdx) => {
                  const startNum = h.split(':')[0];
                  const endNum = String(parseInt(startNum, 10) + 1).padStart(2, '0');
                  return (
                    <th
                      key={h}
                      data-hour-index={hourIdx}
                      className="matrix-hour-th"
                      title={`${h}–${endNum}:00`}
                    >
                      {`${startNum}–${endNum}`}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {orderedStations.map((station) => {
                const isSelectedRow =
                  reservationType !== 1 || effectiveStationId === station.id;

                return (
                  <tr
                    key={station.id}
                    className={
                      effectiveStationId === station.id ? 'matrix-row-selected' : ''
                    }
                  >
                    <td
                      className="matrix-station-td"
                      onClick={() => setSelectedStationId(station.id)}
                      title={station.name}
                    >
                      <div className="matrix-station-cell-inner">
                        <StationIcon type={station.type} name={station.name} />
                        <span>{station.name}</span>
                      </div>
                    </td>
                    {MATRIX_HOURS.map((h, hourIdx) => {
                      const busy = isStationHourBusy(station, h);
                      const slotStartMin = parseInt(h.split(':')[0], 10) * 60;
                      const slotEndMin = slotStartMin + 60;
                      const isSelectedHour =
                        isSelectedRow &&
                        slotStartMin < endMinutes &&
                        slotEndMin > startMinutes;

                      return (
                        <td
                          key={h}
                          data-station-id={station.id}
                          data-hour-index={hourIdx}
                          data-busy={busy ? 'true' : 'false'}
                          tabIndex={busy ? -1 : 0}
                          aria-label={`${station.name} ${h} ${
                            busy ? t('schedule.busy') : t('schedule.free')
                          }`}
                          className={`matrix-slot-td ${
                            busy
                              ? 'slot-td-busy'
                              : isSelectedHour
                              ? 'slot-td-selected'
                              : 'slot-td-free'
                          }`}
                          onPointerDown={(e) => {
                            if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
                            startDrag(station, hourIdx, busy);
                          }}
                          onMouseDown={(e) => {
                            if (busy || e.button !== 0) return;
                            startDrag(station, hourIdx, busy);
                          }}
                          onTouchStart={() => {
                            if (busy) return;
                            startDrag(station, hourIdx, busy);
                          }}
                          onMouseEnter={() => {
                            if (dragSelection) {
                              updateSelectionAtIndex(hourIdx);
                            }
                          }}
                          onClick={() => {
                            if (busy) return;
                            setSelectedStationId(station.id);
                            applyMatrixRange(hourIdx, hourIdx);
                          }}
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, station, hourIdx, busy)
                          }
                          title={
                            busy
                              ? `${station.name} ${h}: ${t('schedule.busy')}`
                              : `${station.name} ${h}–${String(
                                  parseInt(h.split(':')[0], 10) + 1
                                ).padStart(2, '0')}:00: ${t('schedule.free')}`
                          }
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 2-Column Grid of 8 Station Cards (4 rows x 2 cols) */}
        <div className="xamk-stations-8grid" role="listbox" aria-label={t('booking.selectStation')}>
          {orderedStations.map((station) => {
            const isSelected = effectiveStationId === station.id;
            const isAvailable = availableIdSet ? availableIdSet.has(station.id) : true;

            return (
              <Button
                key={station.id}
                type="button"
                variant="station"
                role="option"
                aria-selected={isSelected}
                className={`${isSelected ? 'xamk-station-card-selected' : ''} ${
                  !isAvailable ? 'xamk-station-card-busy' : ''
                }`}
                onClick={() => {
                  setSelectedStationId(station.id);
                  setReservationType(1);
                }}
              >
                <div className="xamk-station-card-left">
                  <StationIcon type={station.type} name={station.name} />
                  <span className="xamk-station-card-name">{station.name}</span>
                </div>
                <Badge variant={!isAvailable ? 'occupied' : 'status'}>
                  {!isAvailable ? (isEn ? 'Booked' : 'Varattu') : 'Status'}
                </Badge>
              </Button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
