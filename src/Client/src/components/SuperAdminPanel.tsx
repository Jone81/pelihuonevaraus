import React, { useState, useId } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
} from 'lucide-react';
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
      setStatusMessage(`Tapahtuma luotu onnistuneesti (ID: ${createdEvent.id.slice(0, 8)}...). Kaikki päällekkäiset varaukset jyrätty.`);
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
      <div className="p-6 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center shadow-xl flex items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        <span>Vain pääkäyttäjällä (SuperAdmin) on pääsy tähän paneeliin.</span>
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
    <div className="w-full max-w-full flex flex-col gap-6">
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 md:p-7 shadow-xl flex flex-col gap-5 max-w-3xl">
        <div className="flex flex-col items-start pb-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white font-sans">
              SuperAdmin — Tapahtumajyräys
            </h2>
          </div>
          <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Sääntö #8: SuperAdminilla on oikeus järjestää oppilaitoksen virallinen tapahtuma ja ohittaa tarvittaessa yksittäisten opiskelijoiden varaukset kyseiseltä ajankohdalta.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleOverride} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#fbba18]" />
                <span>Päivämäärä</span>
              </label>
              <input
                type="date"
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#fbba18]" />
                <span>Alkamisaika</span>
              </label>
              <select
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors cursor-pointer"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
              >
                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#fbba18]" />
                <span>Päättymisaika</span>
              </label>
              <select
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors cursor-pointer"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
              >
                {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#fbba18]" />
              <span>Tapahtuman nimi & perustelu *</span>
            </label>
            <input
              type="text"
              placeholder="esim. Xamk Game Day 2026 tai CS2-kampusturnaus"
              className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Kaikki valitulle ajalle osuvat olemassa olevat opiskelijavaraukset perutaan automaattisesti.</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-[#fbba18] to-amber-600 text-[#0a0b0d] font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={overrideMutation.isPending}
            >
              <Zap className="w-4 h-4" />
              <span>{overrideMutation.isPending ? 'Käsitellään jyräystä...' : 'Jyrää varaukset ja luo tapahtuma'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
