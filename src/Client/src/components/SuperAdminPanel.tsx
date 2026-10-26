import React, { useState, useId } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OverrideReservationRequest } from '../types';

export const SuperAdminPanel: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const formInstanceId = useId();

  const [today] = useState(() => new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(today);
  const [startHour, setStartHour] = useState('10:00');
  const [endHour, setEndHour] = useState('16:00');
  const [reason, setReason] = useState('Virallinen opintojakson eSports-turnaus');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startDateTime = new Date(`${date}T${startHour}:00`);
  const endDateTime = new Date(`${date}T${endHour}:00`);

  const overrideMutation = useMutation({
    mutationFn: (req: OverrideReservationRequest) => api.overrideReservation(req),
    onSuccess: (createdEvent) => {
      setErrorMessage(null);
      setStatusMessage(`✅ Tapahtuma luotu onnistuneesti (ID: ${createdEvent.id.slice(0, 8)}...). Kaikki päällekkäiset varaukset jyrätty.`);
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Jyräysoperaatio epäonnistui.');
      }
    },
  });

  if (!isSuperAdmin) {
    return (
      <div className="alert alert-error">
        Vain pääkäyttäjällä (SuperAdmin) on pääsy tähän paneeliin.
      </div>
    );
  }

  const handleOverride = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!user) return;

    if (endDateTime <= startDateTime) {
      setErrorMessage('Loppuajan on oltava alkuajan jälkeen.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Perustelu jyräykselle on pakollinen.');
      return;
    }

    const request: OverrideReservationRequest = {
      reservationRequest: {
        idempotencyKey: `override-${Date.now()}-${formInstanceId}`,
        userId: user.id,
        reservationType: 3, // Event
        gamingStationId: null,
        startUtc: startDateTime.toISOString(),
        endUtc: endDateTime.toISOString(),
      },
      reason: reason.trim(),
    };

    if (confirm('VAROITUS: Tämä toiminto peruuttaa automaattisesti kaikki samalle aikavälille osuvat muiden käyttäjien varaukset. Haluatko jatkaa?')) {
      overrideMutation.mutate(request);
    }
  };

  return (
    <div className="admin-container">
      <div className="section-header">
        <h2>⚡ SuperAdmin — Tapahtumajyräys</h2>
        <p className="section-description">
          Sääntö #8: SuperAdminilla on oikeus järjestää oppilaitoksen tapahtuma ja jyrätä tarvittaessa yksittäisten opiskelijoiden varaukset kyseiseltä ajankohdalta.
        </p>
      </div>

      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

      <form onSubmit={handleOverride} className="booking-form admin-form">
        <div className="form-grid">
          <div className="space-y-1.5">
            <Label htmlFor="admin-date">
              <span className="calendar-indicator-badge">📅</span> Päivämäärä
            </Label>
            <div className="date-input-with-icon">
              <input
                id="admin-date"
                type="date"
                className="input-touch schedule-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-start">Alkaa</Label>
            <select
              id="admin-start"
              className="flex h-11 w-full rounded-xl border border-border bg-[#15181e] px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbba18]"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
            >
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-end">Päättyy</Label>
            <select
              id="admin-end"
              className="flex h-11 w-full rounded-xl border border-border bg-[#15181e] px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbba18]"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
            >
              {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5 my-4">
          <Label htmlFor="override-reason">Jyräyksen ja tapahtuman perustelu</Label>
          <Input
            id="override-reason"
            type="text"
            placeholder="esim. Koulun virallinen peliturnaus / Vierailijapäivä"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <span className="text-xs text-[#9da3ae]">Tämä viesti tallentuu peruttujen varausten syyksi.</span>
        </div>

        <div className="booking-submit pt-2">
          <Button
            type="submit"
            variant="destructive"
            size="lg"
            className="btn-touch w-full sm:w-auto font-bold text-base px-8 py-3"
            disabled={overrideMutation.isPending}
          >
            {overrideMutation.isPending ? 'Käsitellään jyräystä...' : '⚠️ Jyrää varaukset ja luo tapahtuma'}
          </Button>
        </div>
      </form>
    </div>
  );
};
