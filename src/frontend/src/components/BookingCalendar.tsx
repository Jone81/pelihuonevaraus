/**
 * @file BookingCalendar.tsx
 * @description Pelitilan ensisijainen varausnäkymä ja interaktiivinen 30 minuutin aikataulumatriisi.
 * Vasemmalla puolella on varauslomake (yksittäinen laite, koko tila tai admin-tapahtuma)
 * ja oikealla puolella kaikkien pelipisteiden reaaliaikainen aikataulumatriisi (08:00-18:00, 30 min slotein),
 * jossa aikavälin voi maalata hiirellä tai kosketuksella (drag-to-select).
 */
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gamepad2, Monitor, Building2 } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CreateReservationRequest, GamingStation, ReservationType } from '../types';

/**
 * BookingCalendar-komponentin ominaisuudet (props).
 */
interface BookingCalendarProps {
  /** Funktio kirjautumismodaalin avaamiseen, jos käyttäjä ei ole kirjautunut */
  onRequireLogin: () => void;
  /** Funktio, jota kutsutaan onnistuneen varauksen jälkeen (esim. siirtyminen omiin varauksiin) */
  onSuccessBooking: () => void;
  /** Funktio pohjakuvamodaalin avaamiseen */
  onOpenFloorPlan: () => void;
  /** Valinnainen funktio Omat varaukset -välilehdelle siirtymiseen */
  onNavigateMyBookings?: () => void;
}

/**
 * Pelipisteiden kiinteä esitysjärjestys aikataulumatriisissa ja laitekorteissa.
 */
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

/**
 * Aikataulumatriisin 30 minuutin aikaslotit aukioloajan (08:00-18:00) puitteissa.
 * Toimii myös lomakkeen Alkamisaika-valikon vaihtoehtoina.
 */
const MATRIX_SLOTS: readonly string[] = [
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
];

/**
 * Lomakkeen Päättymisaika-valikon vaihtoehdot 30 minuutin välein (08:30-18:00).
 */
const END_TIME_OPTIONS: readonly string[] = [
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
];

/**
 * Matriisin otsikkorivin tasatuntiryhmät (kukin tunti kattaa kaksi 30 min solua).
 */
const MATRIX_HOUR_HEADERS: readonly number[] = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

/**
 * Muuntaa kellonajan merkkijonosta ('HH:mm') minuuteiksi vuorokauden alusta.
 */
const parseTimeToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parseInt(parts[1] ?? '0', 10);
  return hours * 60 + minutes;
};

/**
 * Muuntaa minuutit vuorokauden alusta 'HH:mm'-muotoiseksi kellonajaksi.
 */
const formatMinutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Palauttaa pelipisteen tyypin tai nimen mukaisen laiteikonin.
 */
const StationIcon: React.FC<{ type: string; name: string }> = ({ type, name }) => {
  if (type === 'NintendoSwitch' || name.includes('Switch')) {
    return (
      <span className="inline-flex items-center justify-center text-[#EF4444] shrink-0" aria-hidden="true">
        <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  if (type === 'PlayStation5' || name.includes('PlayStation')) {
    return (
      <span className="inline-flex items-center justify-center text-[#3B82F6] shrink-0" aria-hidden="true">
        <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center text-[#FACC15] shrink-0" aria-hidden="true">
      <Monitor className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
    </span>
  );
};

/**
 * Varauslomakkeen ja interaktiivisen aikataulumatriisin yhdistävä pääkomponentti.
 */
export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  onRequireLogin,
  onSuccessBooking,
  onNavigateMyBookings,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  // Idempotenssiavain estää saman varauksen vahinkotuplalähetyksen
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  // Lasketaan sallitut päivämäärärajat (tänään .. +2 kuukautta) sekä oletusarkipäivä
  const [dateBounds] = useState(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const d = new Date();
    // Jos kello on yli 17 tai on viikonloppu, siirretään oletuspäivä seuraavaan arkipäivään
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

  // Lomakkeen ja maalauksen (drag-to-select) tilat
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
  const lastPointerDownAtRef = useRef<number>(0);
  const matrixWrapRef = useRef<HTMLDivElement>(null);
  const stickyStationColRef = useRef<HTMLTableCellElement>(null);

  /**
   * Päivittää alkamisajan ja siirtää päättymisajan automaattisesti +30 min päähän (enintään 18:00),
   * jos nykyinen päättymisaika jää uuden alkamisajan kanssa samaksi tai sitä aiemmaksi.
   */
  const handleStartHourChange = useCallback(
    (nextStart: string): void => {
      setStartHour(nextStart);
      const nextStartMin = parseTimeToMinutes(nextStart);
      const currentEndMin = parseTimeToMinutes(endHour);
      if (currentEndMin <= nextStartMin) {
        const adjustedEndMin = Math.min(18 * 60, nextStartMin + 30);
        setEndHour(formatMinutesToTime(adjustedEndMin));
      }
    },
    [endHour]
  );

  const startDateTime = new Date(`${date}T${startHour}:00`);
  const endDateTime = new Date(`${date}T${endHour}:00`);
  const startUtc = startDateTime.toISOString();
  const endUtc = endDateTime.toISOString();

  // Haetaan kaikki pelipisteet
  const { data: allStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.getAllStations(),
  });

  // Haetaan valitulla aikavälillä vapaana olevat pelipisteet
  useQuery({
    queryKey: ['available-stations', startUtc, endUtc],
    queryFn: () => api.getAvailableStations(startUtc, endUtc),
    enabled: endDateTime > startDateTime,
    refetchInterval: 15000,
  });

  const startDayUtc = new Date(`${date}T00:00:00`).toISOString();
  const endDayUtc = new Date(`${date}T23:59:59`).toISOString();

  // Haetaan valitun päivän kaikki aktiiviset varaukset matriisin renderöintiin
  const { data: dayReservations } = useQuery({
    queryKey: ['reservations-day', date],
    queryFn: () => api.getActiveReservations(startDayUtc, endDayUtc),
    refetchInterval: 15000,
  });

  // Järjestetään pelipisteet määritellyn DISPLAY_ORDER-taulukon mukaisesti
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

  // Selvitetään aktiiviseksi valittu pelipiste (tai oletuksena ensimmäinen laite)
  const activeStation = useMemo(() => {
    if (selectedStationId) {
      const found = orderedStations.find((s) => s.id === selectedStationId);
      if (found) return found;
    }
    return orderedStations.find((s) => s.name === 'Nintendo Switch') || orderedStations[0];
  }, [orderedStations, selectedStationId]);

  const effectiveStationId = selectedStationId || activeStation?.id || '';

  /**
   * Tarkistaa onko tietty pelipiste varattuna (tai lukittuna tilavarauksen / SharedTV:n vuoksi)
   * annetun 30 minuutin aikaslotin (`slotStr`, esim. '10:30') aikana.
   */
  const isStationSlotBusy = useCallback(
    (station: GamingStation, slotStr: string): boolean => {
      if (!dayReservations || dayReservations.length === 0) return false;
      const slotStartMin = parseTimeToMinutes(slotStr);
      const slotEndMin = slotStartMin + 30;

      return dayReservations.some((r) => {
        const sDate = new Date(r.startUtc);
        const eDate = new Date(r.endUtc);
        const rStart = sDate.getHours() * 60 + sDate.getMinutes();
        const rEnd = eDate.getHours() * 60 + eDate.getMinutes();
        const overlaps = rStart < slotEndMin && rEnd > slotStartMin;
        if (!overlaps) return false;

        // Koko tilan tai tapahtuman varaus lukitsee kaikki laitteet
        if (r.reservationType === 'Room' || r.reservationType === 'Event') return true;
        // Suora varaus kyseiselle laitteelle
        if (r.gamingStationId === station.id) return true;
        // SharedTV-lukko: jos toinen yhteistä TV:tä käyttävä konsoli on varattu
        if (station.usesSharedTv && r.gamingStationId) {
          const other = orderedStations.find((st) => st.id === r.gamingStationId);
          if (other?.usesSharedTv) return true;
        }
        return false;
      });
    },
    [dayReservations, orderedStations]
  );

  // Mutaatio uuden varauksen lähettämiseen palvelimelle
  const reservationMutation = useMutation({
    mutationFn: (req: CreateReservationRequest) => api.createReservation(req),
    onSuccess: () => {
      setConflictMessage(null);
      setGeneralError(null);
      // Generoidaan uusi idempotenssiavain seuraavaa varausta varten
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
        // Käsitellään 409 Conflict -tilanne (kilpajuoksu kahden varaajan välillä)
        if (err.status === 409 || err.problem?.status === 409) {
          setConflictMessage(
            isEn
              ? '409 Conflict. The selected station or shared console TV was just booked by another user. Availability has been refreshed. Select another station or time.'
              : '409 Ristiriita. Valittu pelipiste tai konsolien yhteinen TV ehdittiin varata toiselle käyttäjälle. Välimuisti on päivitetty. Valitse toinen laite tai aikaväli.'
          );
          queryClient.invalidateQueries({ queryKey: ['available-stations'] });
          queryClient.invalidateQueries({ queryKey: ['available-now'] });
          queryClient.invalidateQueries({ queryKey: ['stations'] });
          queryClient.invalidateQueries({ queryKey: ['reservations-day'] });
          return;
        }
        setGeneralError(err.message);
      } else {
        setGeneralError(
          isEn ? 'Failed to create reservation.' : 'Varauksen luonti epäonnistui.'
        );
      }
    },
  });

  /**
   * Validoi varauslomakkeen tiedot (aukioloajat, arkipäivät, kestorajat) ja lähettää varauksen.
   * Kutsutaan sekä työpöydän varauslomakkeelta että mobiilin kiinteästä alavahvistuspalkista.
   */
  const submitBooking = (): void => {
    setConflictMessage(null);
    setGeneralError(null);

    if (!user) {
      onRequireLogin();
      return;
    }

    // Tarkistetaan, että valittu päivä on arkipäivä (ma-pe)
    const selectedDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setGeneralError(
        isEn
          ? 'The Game Room is open Mon-Fri only. Choose a weekday.'
          : 'Pelihuone on avoinna vain arkisin ma-pe. Valitse arkipäivä.'
      );
      return;
    }

    if (endDateTime <= startDateTime) {
      setGeneralError(
        isEn
          ? 'End time must be after start time.'
          : 'Loppuajan on oltava alkuajan jälkeen.'
      );
      return;
    }

    // Estetään menneisyydessä olevan ajan varaaminen (5 min puskurilla)
    if (startDateTime.getTime() < Date.now() - 5 * 60 * 1000) {
      setGeneralError(
        isEn
          ? 'Selected start time is in the past. Choose a later time or another day.'
          : 'Valittu alkamisaika on jo menneisyydessä. Valitse kuluvaa kellonaikaa myöhäisempi aika tai toinen päivä.'
      );
      return;
    }

    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      setGeneralError(
        isEn
          ? 'Minimum booking duration is 30 minutes.'
          : 'Varauksen vähimmäiskesto on 30 minuuttia.'
      );
      return;
    }

    const stationToBook = effectiveStationId;

    // Tarkistetaan varaustyypin mukaiset enimmäiskestorajat (4 h opiskelijoille, 10 h admineille)
    if (reservationType === 1) {
      if (!stationToBook) {
        setGeneralError(
          isEn ? 'Select a gaming station.' : 'Valitse haluamasi pelipiste.'
        );
        return;
      }
      if (durationMinutes > 240) {
        setGeneralError(
          isEn
            ? 'Maximum duration for a single station reservation is 4 hours.'
            : 'Yksittäisvarauksen enimmäiskesto on 4 tuntia.'
        );
        return;
      }
    } else {
      if (!isAdmin && durationMinutes > 240) {
        setGeneralError(
          isEn
            ? 'Maximum duration for a student room reservation is 4 hours. Longer reservations require Admin rights.'
            : 'Opiskelijan tilavarauksen enimmäiskesto on 4 tuntia. Pidemmät varaukset vaativat Admin-oikeudet.'
        );
        return;
      }
      if (durationMinutes > 600) {
        setGeneralError(
          isEn
            ? 'Maximum duration for a room reservation is 10 hours within opening hours.'
            : 'Tilavarauksen enimmäiskesto on 10 tuntia aukioloajan puitteissa.'
        );
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

  /**
   * Käsittelee varauslomakkeen lähetyksen.
   */
  const handleBooking = (e: React.FormEvent): void => {
    e.preventDefault();
    submitBooking();
  };

  /**
   * Asettaa lomakkeen alkamis- ja päättymisajan 30 minuutin tarkkuudella
   * matriisin maalattujen slottien indeksien perusteella.
   */
  const applyMatrixRange = useCallback((minIdx: number, maxIdx: number) => {
    const startSlot = MATRIX_SLOTS[minIdx];
    const endMin = Math.min(18 * 60, parseTimeToMinutes(MATRIX_SLOTS[maxIdx]) + 30);
    const endSlot = formatMinutesToTime(endMin);
    setStartHour(startSlot);
    setEndHour(endSlot);
  }, []);

  /**
   * Päivittää maalattavan aikavälin päätepisteen ottaen huomioon enimmäiskeston
   * (4 h = 8 slottia, Admin-tilavarauksessa 10 h = 20 slottia) ja pysähtyen
   * mahdollisiin välissä oleviin varattuihin aikaslotteihin.
   */
  const updateSelectionAtIndex = useCallback(
    (slotIdx: number) => {
      const currentDrag = dragSelectionRef.current;
      if (!currentDrag) return;
      const targetStation = orderedStations.find((s) => s.id === currentDrag.stationId);
      if (!targetStation) return;

      const { anchorIndex } = currentDrag;
      const step = slotIdx >= anchorIndex ? 1 : -1;
      const maxAllowedSpan = reservationType !== 1 && isAdmin ? 20 : 8;

      let clampedIdx = anchorIndex;
      for (
        let i = anchorIndex + step;
        step > 0 ? i <= slotIdx : i >= slotIdx;
        i += step
      ) {
        if (Math.abs(i - anchorIndex) + 1 > maxAllowedSpan) {
          break;
        }
        if (isStationSlotBusy(targetStation, MATRIX_SLOTS[i])) {
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
    [orderedStations, reservationType, isAdmin, applyMatrixRange, isStationSlotBusy]
  );

  /**
   * Selvittää kursorin tai kosketuspisteen alla olevan 30 min aikasolun ja päivittää maalauksen.
   * Huomioi vasemman kiinnitetyn (sticky) pelipistesarakkeen leveyden vaakavierityksessä.
   */
  const updateSelectionAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragSelectionRef.current) return;

      // Automaattinen vaakavieritys, jos sormi/kursori viedään lähelle taulukon reunaa
      if (matrixWrapRef.current) {
        const wrapRect = matrixWrapRef.current.getBoundingClientRect();
        const stickyWidth = stickyStationColRef.current
          ? stickyStationColRef.current.getBoundingClientRect().width
          : 144;
        const edgeThreshold = 36;
        if (clientX > wrapRect.right - edgeThreshold) {
          matrixWrapRef.current.scrollLeft += 12;
        } else if (clientX < wrapRect.left + stickyWidth + edgeThreshold) {
          matrixWrapRef.current.scrollLeft -= 12;
        }
      }

      const el = document.elementFromPoint(clientX, clientY);
      const cell = el?.closest<HTMLElement>('.matrix-slot-td, .matrix-hour-th');
      if (!cell) return;

      const rawSlotIdx = cell.getAttribute('data-slot-index');
      if (rawSlotIdx !== null) {
        const slotIdx = parseInt(rawSlotIdx, 10);
        if (!isNaN(slotIdx)) {
          updateSelectionAtIndex(slotIdx);
        }
        return;
      }

      // Jos osoitin osuu tuntiotsikkoon (colSpan=2), valitaan kumpi 30 min puolikas on lähempänä
      const rawHourStartIdx = cell.getAttribute('data-hour-start-index');
      if (rawHourStartIdx !== null) {
        const baseIdx = parseInt(rawHourStartIdx, 10);
        if (!isNaN(baseIdx)) {
          const rect = cell.getBoundingClientRect();
          const halfOffset = clientX - rect.left >= rect.width / 2 ? 1 : 0;
          updateSelectionAtIndex(Math.min(MATRIX_SLOTS.length - 1, baseIdx + halfOffset));
        }
      }
    },
    [updateSelectionAtIndex]
  );

  /**
   * Aloittaa aikavälin maalaamisen (drag-to-select) vapaasta 30 min aikasolusta.
   */
  const startDrag = useCallback(
    (station: GamingStation, slotIdx: number, busy: boolean) => {
      if (busy) return;
      setSelectedStationId(station.id);
      const newDrag = {
        stationId: station.id,
        anchorIndex: slotIdx,
        currentIndex: slotIdx,
      };
      setDragSelection(newDrag);
      dragSelectionRef.current = newDrag;
      applyMatrixRange(slotIdx, slotIdx);
    },
    [applyMatrixRange]
  );

  /**
   * Lopettaa aikavälin maalaamisen.
   */
  const stopDrag = useCallback(() => {
    setDragSelection(null);
    dragSelectionRef.current = null;
  }, []);

  const isDragging = dragSelection !== null;

  // Kuunnellaan ikkunatason osoitin- ja kosketustapahtumia maalaamisen aikana
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateSelectionAtPoint(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
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
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
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
  }, [isDragging, updateSelectionAtPoint, stopDrag]);

  /**
   * Mahdollistaa 30 min aikasolun valitsemisen näppäimistöllä (Enter tai välilyönti).
   */
  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    station: GamingStation,
    slotIdx: number,
    busy: boolean
  ) => {
    if (busy) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedStationId(station.id);
      applyMatrixRange(slotIdx, slotIdx);
    }
  };

  // Muunnetaan valitut kellonajat minuuteiksi vuorokauden alusta solujen korostusta varten
  const startMinutes = useMemo(() => parseTimeToMinutes(startHour), [startHour]);
  const endMinutes = useMemo(() => parseTimeToMinutes(endHour), [endHour]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pb-24 lg:pb-0">
      {/* LEFT COLUMN (desktop) / SECOND SECTION (mobile): Tee uusi varaus */}
      <section className="order-2 lg:order-1 lg:col-span-5 h-full flex flex-col gap-5 rounded-none bg-white text-[#09090B] border-2 border-black shadow-[5px_5px_0px_#FACC15] p-5 sm:p-6" aria-labelledby="heading-new-booking">
        <div className="space-y-2">
          <h2 id="heading-new-booking" className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#09090B]">{t('booking.title')}</h2>
          <div className="h-1 w-16 bg-[#FACC15] border border-black" />
        </div>

        {conflictMessage && (
          <div className="p-3.5 rounded-none bg-[#EF4444] text-white border-2 border-black font-mono font-bold text-xs sm:text-sm shadow-[3px_3px_0px_#000000]" role="alert">
            {conflictMessage}
          </div>
        )}

        {generalError && (
          <div className="p-3.5 rounded-none bg-[#EF4444] text-white border-2 border-black font-mono font-bold text-xs sm:text-sm shadow-[3px_3px_0px_#000000]" role="alert">
            {generalError}
          </div>
        )}

        <form onSubmit={handleBooking} className="flex-1 flex flex-col gap-4">
          {/* Varaustyyppi (shadcn/ui Tabs 3-segment control) */}
          <div className="space-y-1.5">
            <Label className="text-[#09090B] font-mono font-bold text-xs uppercase tracking-wider">{t('booking.typeLabel')}</Label>
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
                  {isEn ? 'Single station' : 'Yksittäinen laite'}
                </TabsTrigger>
                <TabsTrigger value="2">
                  {isEn ? 'Whole room' : 'Koko tila'}
                </TabsTrigger>
                {isAdmin ? (
                  <TabsTrigger value="3">
                    {isEn ? 'Event, Admin' : 'Tapahtuma'}
                  </TabsTrigger>
                ) : (
                  <TabsTrigger value="my-bookings">
                    {isEn ? 'My bookings' : 'Omat varaukset'}
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Päivämäärä */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-[#09090B] font-mono font-bold text-xs uppercase tracking-wider">{t('booking.date')}</Label>
            <div className="w-full">
              <input
                id="date"
                type="date"
                className="w-full min-h-[44px] px-3 py-2 rounded-none bg-white text-[#09090B] font-mono font-bold text-sm border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
                min={dateBounds.today}
                max={dateBounds.maxDateStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row: Alkamisaika & Päättymisaika */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startHour" className="text-[#09090B] font-mono font-bold text-xs uppercase tracking-wider">{t('booking.startTime')}</Label>
              <div className="w-full">
                <select
                  id="startHour"
                  className="w-full min-h-[44px] px-3 py-2 rounded-none bg-white text-[#09090B] font-mono font-bold text-sm border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
                  value={startHour}
                  onChange={(e) => handleStartHourChange(e.target.value)}
                >
                  {MATRIX_SLOTS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endHour" className="text-[#09090B] font-mono font-bold text-xs uppercase tracking-wider">{t('booking.endTime')}</Label>
              <div className="w-full">
                <select
                  id="endHour"
                  className="w-full min-h-[44px] px-3 py-2 rounded-none bg-white text-[#09090B] font-mono font-bold text-sm border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                >
                  {END_TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {isEn ? `End time ${time}` : `Päättymisaika ${time}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pelipisteen valinta / koko tilan yhteenveto */}
          <div className="w-full border-2 border-black bg-[#F4F4F5]">
            {reservationType === 1 ? (
              <select
                aria-label={t('booking.selectStation')}
                className="w-full min-h-[44px] px-3 py-2 rounded-none bg-[#F4F4F5] text-[#09090B] font-mono font-bold text-sm border-0 focus:outline-none focus:ring-0 focus:shadow-[inset_0_0_0_2px_#FACC15]"
                value={effectiveStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
              >
                {orderedStations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({startHour}-{endHour})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 font-mono font-bold text-sm text-[#09090B]">
                <Building2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                <span>
                  {reservationType === 2 ? t('booking.type.room') : t('booking.type.event')} ({startHour}-{endHour})
                </span>
              </div>
            )}
          </div>

          {/* Submit Pill Button (shadcn/ui Button) */}
          <div className="mt-auto pt-2">
            <Button
              type="submit"
              variant="pill"
              className="w-full"
              disabled={reservationMutation.isPending || (reservationType === 1 && !effectiveStationId)}
            >
              <span>
                {reservationMutation.isPending
                  ? t('booking.processing')
                  : t('booking.submit')}
              </span>
            </Button>
          </div>
        </form>
      </section>

      {/* RIGHT COLUMN (desktop) / FIRST SECTION (mobile): Päivän varaukset ja aikataulu */}
      <section className="order-1 lg:order-2 lg:col-span-7 h-full flex flex-col gap-5 rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-5 sm:p-6" aria-labelledby="heading-day-schedule">
        <div className="space-y-2">
          <h2 id="heading-day-schedule" className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('schedule.title')}</h2>
          <div className="h-1 w-16 bg-[#FACC15] border border-black" />
        </div>

        {/* Kompaktit mobiilikontrollit aikataulumatriisin yläpuolella */}
        <div className="lg:hidden space-y-3">
          {conflictMessage && (
            <div className="p-3 rounded-none bg-[#EF4444] text-white border-2 border-black font-mono font-bold text-xs shadow-[3px_3px_0px_#000000]" role="alert">
              {conflictMessage}
            </div>
          )}

          {generalError && (
            <div className="p-3 rounded-none bg-[#EF4444] text-white border-2 border-black font-mono font-bold text-xs shadow-[3px_3px_0px_#000000]" role="alert">
              {generalError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[#A1A1AA] font-mono font-bold text-xs uppercase tracking-wider">
              {t('booking.typeLabel')}
            </Label>
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
                  {isEn ? 'Single station' : 'Yksittäinen laite'}
                </TabsTrigger>
                <TabsTrigger value="2">
                  {isEn ? 'Whole room' : 'Koko tila'}
                </TabsTrigger>
                {isAdmin ? (
                  <TabsTrigger value="3">
                    {isEn ? 'Event, Admin' : 'Tapahtuma'}
                  </TabsTrigger>
                ) : (
                  <TabsTrigger value="my-bookings">
                    {isEn ? 'My bookings' : 'Omat varaukset'}
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mobile-date" className="text-[#A1A1AA] font-mono font-bold text-xs uppercase tracking-wider">
              {t('booking.date')}
            </Label>
            <input
              id="mobile-date"
              type="date"
              className="w-full min-h-[44px] px-3 py-2 rounded-none bg-white text-[#09090B] font-mono font-bold text-sm border-2 border-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15]"
              min={dateBounds.today}
              max={dateBounds.maxDateStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA]">
            {isEn ? 'Available TV and station schedule' : 'Aikataulu ja TV-varaukset'}
          </span>
          <span className="hidden sm:inline font-mono font-bold text-xs text-[#FACC15]">
            {isEn
              ? `Drag across slots to select time (30 min–4 h), ${startHour}-${endHour}`
              : `Maalaa aikaväli vetämällä (30 min–4 h), ${startHour}-${endHour}`}
          </span>
          <span className="sm:hidden font-mono font-bold text-[11px] text-[#FACC15]">
            {isEn
              ? `Drag slots to select (30 min–4 h), ${startHour}-${endHour}`
              : `Valitse vetämällä sormella (30 min–4 h), ${startHour}-${endHour}`}
          </span>
        </div>

        {/* All-Devices 30-Minute Matrix Table with Drag-to-Select */}
        <div
          ref={matrixWrapRef}
          className={`overflow-x-auto overscroll-x-contain border-2 border-[#3F444E] bg-[#121417] ${
            isDragging ? 'touch-none select-none cursor-grabbing' : 'touch-pan-x touch-pan-y'
          }`}
        >
          <table className="w-full min-w-[820px] border-collapse table-fixed">
            <thead>
              <tr>
                <th
                  ref={stickyStationColRef}
                  className="sticky left-0 z-20 w-28 sm:w-44 px-2.5 sm:px-3 py-2.5 text-left font-mono font-bold text-xs uppercase tracking-wider text-[#A1A1AA] bg-[#1C1F24] border-b-2 border-r border-[#3F444E] touch-pan-x touch-pan-y"
                >
                  {t('schedule.station')}
                </th>
                {MATRIX_HOUR_HEADERS.map((hourNum, hourIdx) => {
                  const startNum = String(hourNum).padStart(2, '0');
                  const endNum = String(hourNum + 1).padStart(2, '0');
                  return (
                    <th
                      key={hourNum}
                      colSpan={2}
                      data-hour-start-index={hourIdx * 2}
                      className="matrix-hour-th px-1 py-2.5 text-center font-mono font-bold text-[11px] text-[#A1A1AA] bg-[#1C1F24] border-b-2 border-r border-[#3F444E] last:border-r-0 select-none touch-pan-x touch-pan-y"
                      title={`${startNum}:00-${endNum}:00`}
                    >
                      {`${startNum}-${endNum}`}
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
                    className={`border-b border-[#3F444E] last:border-b-0 ${
                      effectiveStationId === station.id ? 'bg-[#1C1F24]' : 'bg-[#121417]'
                    }`}
                  >
                    <td
                      className={`sticky left-0 z-10 px-3 py-2 border-r border-[#3F444E] cursor-pointer hover:bg-[#252930] transition-colors touch-pan-x touch-pan-y ${
                        effectiveStationId === station.id
                          ? 'bg-[#1C1F24] border-l-4 border-l-[#FACC15]'
                          : 'bg-[#121417]'
                      }`}
                      onClick={() => setSelectedStationId(station.id)}
                      title={station.name}
                    >
                      <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#F4F4F5] truncate">
                        <StationIcon type={station.type} name={station.name} />
                        <span className="truncate">{station.name}</span>
                      </div>
                    </td>
                    {MATRIX_SLOTS.map((slot, slotIdx) => {
                      const busy = isStationSlotBusy(station, slot);
                      const slotStartMin = parseTimeToMinutes(slot);
                      const slotEndMin = slotStartMin + 30;
                      const slotEndStr = formatMinutesToTime(slotEndMin);
                      const isSelectedSlot =
                        isSelectedRow &&
                        slotStartMin < endMinutes &&
                        slotEndMin > startMinutes;
                      const isHalfHourDivider = slotIdx % 2 === 0;
                      const rightBorderClass = isHalfHourDivider
                        ? 'border-r border-dashed border-[#3F444E]/45'
                        : 'border-r border-[#3F444E] last:border-r-0';

                      return (
                        <td
                          key={slot}
                          data-station-id={station.id}
                          data-slot-index={slotIdx}
                          data-busy={busy ? 'true' : 'false'}
                          tabIndex={busy ? -1 : 0}
                          aria-label={`${station.name} ${slot}-${slotEndStr}: ${
                            busy ? t('schedule.busy') : t('schedule.free')
                          }`}
                          className={`matrix-slot-td h-10 ${rightBorderClass} transition-colors select-none touch-none ${
                            busy
                              ? 'bg-[#EF4444]/85 cursor-not-allowed'
                              : isSelectedSlot
                              ? 'bg-[#FACC15] text-[#09090B] cursor-pointer shadow-[inset_0_0_0_2px_#000000]'
                              : 'bg-[#1C1F24] hover:bg-[#252930] hover:shadow-[inset_0_0_0_2px_#22C55E] cursor-pointer'
                          }`}
                          onPointerDown={(e) => {
                            if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
                            if (dragSelectionRef.current) return;
                            lastPointerDownAtRef.current = Date.now();
                            startDrag(station, slotIdx, busy);
                          }}
                          onClick={() => {
                            if (Date.now() - lastPointerDownAtRef.current < 500) return;
                            if (busy) return;
                            setSelectedStationId(station.id);
                            applyMatrixRange(slotIdx, slotIdx);
                          }}
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, station, slotIdx, busy)
                          }
                          title={`${station.name} ${slot}-${slotEndStr}: ${
                            busy ? t('schedule.busy') : t('schedule.free')
                          }`}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Kiinteä alavahvistuspalkki mobiilinäkymässä */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#121417]/95 backdrop-blur-sm border-t-2 border-[#FACC15] shadow-[0_-4px_16px_rgba(0,0,0,0.65)] px-3 sm:px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-[#F4F4F5] truncate">
              {reservationType === 1 ? (
                <>
                  {activeStation && (
                    <StationIcon type={activeStation.type} name={activeStation.name} />
                  )}
                  <span className="truncate">
                    {activeStation?.name || t('booking.selectStation')}
                  </span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                  <span className="truncate">
                    {reservationType === 2 ? t('booking.type.room') : t('booking.type.event')}
                  </span>
                </>
              )}
            </div>
            <div className="font-mono font-extrabold text-xs text-[#FACC15] truncate">
              {`${startHour}-${endHour}`}
            </div>
          </div>
          <Button
            type="button"
            variant="xamk"
            className="min-h-[44px] px-3 sm:px-4 text-xs sm:text-sm shrink-0"
            onClick={submitBooking}
            disabled={reservationMutation.isPending || (reservationType === 1 && !effectiveStationId)}
          >
            {reservationMutation.isPending
              ? t('booking.processing')
              : t('booking.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
};
