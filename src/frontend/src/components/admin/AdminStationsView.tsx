/**
 * @file AdminStationsView.tsx
 * @description Ylläpitopaneelin pelipisteiden ja pelitilan huoltohallintanäkymä.
 * Sisältää koko pelitilan poikkeussulun (huoltotila + tiedote) sekä 8 pelipisteen
 * laitekohtaisen käyttö- ja huoltotilan vaihtamisen.
 */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wrench, Monitor, Gamepad2 } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { UpdateSiteSettingsRequest } from '../../types';

/**
 * AdminStationsView-komponentin ominaisuudet.
 */
export interface AdminStationsViewProps {
  /** Callback onnistumisviestin näyttämiseen */
  onStatus: (msg: string | null) => void;
  /** Callback virheviestin näyttämiseen */
  onError: (msg: string | null) => void;
}

/**
 * Pelitilan huoltotilan ja 8 pelipisteen laitehallintanäkymä.
 */
export const AdminStationsView: React.FC<AdminStationsViewProps> = ({
  onStatus,
  onError,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const [isMaintenanceModeDraft, setIsMaintenanceModeDraft] = useState<boolean | null>(null);
  const [maintenanceMessageDraft, setMaintenanceMessageDraft] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    enabled: isAdmin,
  });

  const { data: adminStations } = useQuery({
    queryKey: ['admin-stations'],
    queryFn: () => api.getAllStationsForAdmin(),
    enabled: isAdmin,
  });

  const isMaintenanceMode = isMaintenanceModeDraft ?? settings?.isMaintenanceMode ?? false;
  const maintenanceMessage = maintenanceMessageDraft ?? settings?.maintenanceMessage ?? '';

  // Päivitä pelitilan toimintatila (huoltotila + viesti), säilyttäen muut asetukset
  const updateMaintenanceMutation = useMutation({
    mutationFn: (req: UpdateSiteSettingsRequest) => api.updateSettings(req, user?.id ?? ''),
    onSuccess: () => {
      onStatus(
        isEn
          ? 'Room operational mode updated.'
          : 'Pelitilan toimintatila ja huoltotiedote tallennettu.'
      );
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update operational mode.'
          : 'Tilan toimintatilan tallennus epäonnistui.'
      );
    },
  });

  // Päivitä yksittäisen pelipisteen käyttötila (Käytössä / Huollossa)
  const updateStationStatusMutation = useMutation({
    mutationFn: ({ stationId, isActive }: { stationId: string; isActive: boolean }) =>
      api.updateStationStatus(stationId, { isActive }, user?.id ?? ''),
    onSuccess: (updatedStation) => {
      onStatus(
        isEn
          ? `Station "${updatedStation.name}" is now ${updatedStation.isActive ? 'active' : 'in maintenance'}.`
          : `Pelipiste "${updatedStation.name}" on nyt ${updatedStation.isActive ? 'käytössä' : 'huoltotilassa'}.`
      );
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-stations'] });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update station status.'
          : 'Pelipisteen tilan päivitys epäonnistui.'
      );
    },
  });

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    onStatus(null);
    onError(null);

    updateMaintenanceMutation.mutate({
      discordWebhookUrl: settings?.discordWebhookUrl ?? '',
      openTimeHour: settings?.openTimeHour ?? 8,
      closeTimeHour: settings?.closeTimeHour ?? 18,
      onlyWeekdays: settings?.onlyWeekdays ?? true,
      maxAdvanceBookingMonths: settings?.maxAdvanceBookingMonths ?? 2,
      maxIndividualHours: settings?.maxIndividualHours ?? 4,
      maxStudentRoomHours: settings?.maxStudentRoomHours ?? 4,
      minReservationMinutes: settings?.minReservationMinutes ?? 30,
      enforceSharedTvLock: settings?.enforceSharedTvLock ?? true,
      isMaintenanceMode,
      maintenanceMessage: maintenanceMessage.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Pelitilan toimintatila ja poikkeussulku */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Wrench className="w-5 h-5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
            <span>
              {isEn ? 'Room operational status and maintenance' : 'Pelitilan toimintatila ja poikkeussulku'}
            </span>
          </CardTitle>
          <div className="w-12 h-1 bg-[#FACC15] my-1" />
          <CardDescription>
            {isEn
              ? 'Temporarily lock the Game Room for maintenance, cleaning, or equipment upgrades.'
              : 'Sulje pelihuone tilapäisesti opiskelijavarauksilta esimerkiksi huollon, siivouksen tai päivitysten ajaksi.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveMaintenance} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-5 flex flex-col gap-1.5">
            <Label htmlFor="maintenance-mode-select">
              {isEn ? 'Room operational mode' : 'Pelihuoneen toimintatila'}
            </Label>
            <NativeSelect
              id="maintenance-mode-select"
              value={isMaintenanceMode ? 'maintenance' : 'normal'}
              onChange={(e) => {
                setIsMaintenanceModeDraft(e.target.value === 'maintenance');
                onStatus(null);
              }}
            >
              <option value="normal">
                {isEn
                  ? 'Open normally, student bookings enabled'
                  : 'Avoinna normaalisti, opiskelijavaraukset käytössä'}
              </option>
              <option value="maintenance">
                {isEn
                  ? 'Maintenance mode, block new student bookings'
                  : 'Huoltotila, estää uudet opiskelijavaraukset'}
              </option>
            </NativeSelect>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-1.5">
            <Label htmlFor="maintenance-msg-input">
              {isEn ? 'Maintenance notice to students' : 'Huoltotiedote käyttäjille'}
            </Label>
            <Input
              id="maintenance-msg-input"
              type="text"
              placeholder={
                isEn
                  ? 'For example Closed for PC updates until 14:00'
                  : 'Esimerkiksi Pelihuone on huollossa laitepäivitysten vuoksi klo 14:00 asti.'
              }
              value={maintenanceMessage}
              onChange={(e) => {
                setMaintenanceMessageDraft(e.target.value);
                onStatus(null);
              }}
            />
          </div>

          <div className="lg:col-span-2 flex justify-start lg:justify-end">
            <Button
              type="submit"
              variant="pill"
              className="w-full lg:w-auto"
              disabled={updateMaintenanceMutation.isPending}
            >
              <span>
                {updateMaintenanceMutation.isPending
                  ? isEn
                    ? 'Saving...'
                    : 'Tallennetaan...'
                  : isEn
                  ? 'Save status'
                  : 'Tallenna tila'}
              </span>
            </Button>
          </div>
        </form>
      </Card>

      {/* 8 pelipisteen laitekohtainen huoltohallinta */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Monitor className="w-5 h-5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
            <span>
              {isEn
                ? 'Gaming stations hardware and maintenance control'
                : 'Pelipisteiden laitehallinta ja huoltotila, 8 laitetta'}
            </span>
          </CardTitle>
          <div className="w-12 h-1 bg-[#FACC15] my-1" />
          <CardDescription>
            {isEn
              ? 'Enable or disable individual gaming stations. Disabled stations are immediately hidden from student bookings during maintenance or repairs.'
              : 'Hallitse yksittäisten pelipisteiden, PC 1-PC 6, PS5 ja Switch, käyttötilaa. Huoltotilaan asetettu laite lukitaan välittömästi uusilta varauksilta.'}
          </CardDescription>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {(adminStations ?? []).map((st) => (
            <div
              key={st.id}
              className={`rounded-none bg-[#121417] border-2 p-4 flex items-center justify-between gap-3 flex-wrap ${
                st.isActive ? 'border-[#3F444E] opacity-100' : 'border-[#EF4444] opacity-85'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#1C1F24] border border-[#3F444E] text-[#FACC15] shrink-0"
                  aria-hidden="true"
                >
                  {st.type === 'PC' ? (
                    <Monitor className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                    {st.name}
                  </div>
                  <div className="font-mono text-xs text-[#9CA3AF]">
                    {st.type}
                    {st.usesSharedTv ? ', SharedTV' : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={st.isActive ? 'installed' : 'wishlist'}>
                  {st.isActive
                    ? isEn
                      ? 'ACTIVE'
                      : 'KÄYTÖSSÄ'
                    : isEn
                    ? 'MAINTENANCE'
                    : 'HUOLLOSSA'}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant={st.isActive ? 'destructive' : 'pill'}
                  disabled={updateStationStatusMutation.isPending}
                  onClick={() =>
                    updateStationStatusMutation.mutate({
                      stationId: st.id,
                      isActive: !st.isActive,
                    })
                  }
                >
                  {st.isActive
                    ? isEn
                      ? 'Set maintenance'
                      : 'Aseta huoltoon'
                    : isEn
                    ? 'Restore active'
                    : 'Palauta käyttöön'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
