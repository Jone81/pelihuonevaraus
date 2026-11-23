/**
 * @file useGameRoomRealtime.ts
 * @description SignalR-reaaliaikayhteyden hallintakoukku Xamk Game Roomille.
 * Yhdistää palvelimen `/hubs/gameroom`-hubiin ja invalidoi TanStack Query -välimuistin
 * kohdennetusti palvelimen ilmoittaessa varaus-, pelipiste-, asetus-, vikailmoitus-,
 * tiedote- tai pelimuutoksista.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

/**
 * Palvelimen SignalR-tapahtumien ja niihin liittyvien TanStack Query -avainten kartoitus.
 */
const EVENT_QUERY_KEYS: Readonly<Record<string, readonly (readonly string[])[]>> = {
  ReservationChanged: [
    ['reservations'],
    ['reservations-day'],
    ['my-reservations'],
    ['admin-reservations'],
    ['available-stations'],
    ['available-now'],
    ['statistics'],
  ],
  StationStatusChanged: [
    ['stations'],
    ['admin-stations'],
    ['available-stations'],
    ['available-now'],
  ],
  SettingsChanged: [
    ['settings'],
    ['available-stations'],
    ['available-now'],
  ],
  IssueReportChanged: [['issues']],
  NewsChanged: [['news']],
  GamesChanged: [['games'], ['wishlist'], ['statistics']],
};

/**
 * Ylläpitää SignalR-yhteyttä `/hubs/gameroom`-päätepisteeseen ja päivittää
 * sovelluksen välimuistitetut näkymät automaattisesti reaaliajassa.
 */
export function useGameRoomRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    let isDisposed = false;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/gameroom')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    const invalidateKeys = (keys: readonly (readonly string[])[]): void => {
      if (isDisposed) return;
      for (const queryKey of keys) {
        void queryClient.invalidateQueries({ queryKey: [...queryKey] });
      }
    };

    const eventEntries = Object.entries(EVENT_QUERY_KEYS);
    for (const [eventName, queryKeys] of eventEntries) {
      connection.on(eventName, () => {
        invalidateKeys(queryKeys);
      });
    }

    const startConnection = async (): Promise<void> => {
      try {
        await connection.start();
        if (isDisposed) {
          void connection.stop();
        }
      } catch {
        // Ohitetaan käynnistysvirhe siististi, jos komponentti purettiin kesken aloituksen
        // (esim. React 19 StrictModen kehitysaikainen mount/unmount-sykli) tai palvelin on tilapäisesti alhaalla.
      }
    };

    void startConnection();

    return () => {
      isDisposed = true;
      for (const [eventName] of eventEntries) {
        connection.off(eventName);
      }
      void connection.stop();
    };
  }, [queryClient]);
}
