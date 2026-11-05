/**
 * @file AdminPanel.tsx
 * @description Ylläpitäjän (Admin ja SuperAdmin) monivälilehtinen hallintapaneeli.
 * Sisältää kuusi alavälilehteä (`AdminSubTab`):
 * 1) Pelit & Toivelista (`games`)
 * 2) Uutiset & Tiedotteet (`news`)
 * 3) Käyttäjät & Roolit (`users`)
 * 4) Asetukset & Discord Webhook (`settings`)
 * 5) Tilastot & Käyttöaste (`statistics`)
 * 6) Vikailmoitukset (`issues`)
 */
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter, type AdminSubTab } from '../router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type {
  BanUserRequest,
  CreateGameRequest,
  CreateNewsRequest,
  UpdateSiteSettingsRequest,
} from '../types';

/**
 * Ylläpitäjän hallintapaneelikomponentti.
 */
export const AdminPanel: React.FC = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();
  const { adminSubTab: activeSubTab, setAdminSubTab: setActiveSubTab, setActiveTab } = useRouter();

  // Pelien lisäys & suodatus
  const [newGameName, setNewGameName] = useState('');
  const [newGamePlatform, setNewGamePlatform] = useState('PC');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [gameFilter, setGameFilter] = useState<'ALL' | 'INSTALLED' | 'WISHLIST'>('ALL');
  const [gameSearch, setGameSearch] = useState('');

  // Tiedotteiden lisäys
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsIsPinned, setNewsIsPinned] = useState(false);
  const [previewNews, setPreviewNews] = useState(false);

  // Käyttäjien haku sekä käyttäjäkohtaiset bannauksen pituus- ja syyvalinnat
  const [userSearch, setUserSearch] = useState('');
  const [banDurations, setBanDurations] = useState<Record<string, string>>({});
  const [banReasons, setBanReasons] = useState<Record<string, string>>({});

  // Asetukset, kiintiöt ja huoltotila (luonnokset tai palvelimen oletukset)
  const [discordWebhookUrlDraft, setDiscordWebhookUrl] = useState<string | null>(null);
  const [openTimeHourDraft, setOpenTimeHourDraft] = useState<number | null>(null);
  const [closeTimeHourDraft, setCloseTimeHourDraft] = useState<number | null>(null);
  const [onlyWeekdaysDraft, setOnlyWeekdaysDraft] = useState<boolean | null>(null);
  const [maxAdvanceMonthsDraft, setMaxAdvanceMonthsDraft] = useState<number | null>(null);
  const [maxIndividualHoursDraft, setMaxIndividualHoursDraft] = useState<number | null>(null);
  const [maxStudentRoomHoursDraft, setMaxStudentRoomHoursDraft] = useState<number | null>(null);
  const [minReservationMinutesDraft, setMinReservationMinutesDraft] = useState<number | null>(null);
  const [enforceSharedTvLockDraft, setEnforceSharedTvLockDraft] = useState<boolean | null>(null);
  const [isMaintenanceModeDraft, setIsMaintenanceModeDraft] = useState<boolean | null>(null);
  const [maintenanceMessageDraft, setMaintenanceMessageDraft] = useState<string | null>(null);

  // Vikailmoitusten suodatus & kuittausmuistiinpanot
  const [issueFilter, setIssueFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({});

  // Yleiset onnistumis- ja virheviestit
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  // Kyselyt: haetaan ylläpitopaneelin tarvitsemat tiedot taustajärjestelmästä
  const { data: allGames } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.getGames(),
    enabled: isAdmin,
  });

  const { data: allNews } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
    enabled: isAdmin,
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getAllUsers(user?.id ?? ''),
    enabled: isAdmin,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    enabled: isAdmin,
  });

  // Haetaan kaikki pelipisteet (myös huoltotilassa olevat) ylläpidon laitehallintaa varten
  const { data: adminStations } = useQuery({
    queryKey: ['admin-stations'],
    queryFn: () => api.getAllStationsForAdmin(),
    enabled: isAdmin,
  });

  // Haetaan tulevat aktiiviset varaukset seuraavan 14 vuorokauden ajalta ylläpidon hallintataulukkoon
  const { data: upcomingReservations } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => {
      const start = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      return api.getActiveReservations(start, end);
    },
    enabled: isAdmin && activeSubTab === 'settings',
  });

  // Käytetään joko muokattavaa luonnosta tai palvelimelta ladattuja asetuksia
  const discordWebhookUrl = discordWebhookUrlDraft ?? settings?.discordWebhookUrl ?? '';
  const openTimeHour = openTimeHourDraft ?? settings?.openTimeHour ?? 8;
  const closeTimeHour = closeTimeHourDraft ?? settings?.closeTimeHour ?? 18;
  const onlyWeekdays = onlyWeekdaysDraft ?? settings?.onlyWeekdays ?? true;
  const maxAdvanceBookingMonths = maxAdvanceMonthsDraft ?? settings?.maxAdvanceBookingMonths ?? 2;
  const maxIndividualHours = maxIndividualHoursDraft ?? settings?.maxIndividualHours ?? 4;
  const maxStudentRoomHours = maxStudentRoomHoursDraft ?? settings?.maxStudentRoomHours ?? 4;
  const minReservationMinutes = minReservationMinutesDraft ?? settings?.minReservationMinutes ?? 30;
  const enforceSharedTvLock = enforceSharedTvLockDraft ?? settings?.enforceSharedTvLock ?? true;
  const isMaintenanceMode = isMaintenanceModeDraft ?? settings?.isMaintenanceMode ?? false;
  const maintenanceMessage = maintenanceMessageDraft ?? settings?.maintenanceMessage ?? '';

  const { data: statistics } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.getStatistics(),
    enabled: isAdmin && activeSubTab === 'statistics',
    refetchInterval: activeSubTab === 'statistics' ? 10000 : false,
  });

  const { data: allIssues } = useQuery({
    queryKey: ['issues'],
    queryFn: () => api.getIssueReports(user?.id ?? ''),
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  // Lisää peli suoraan asennettuun pelivalikoimaan
  const addGameMutation = useMutation({
    mutationFn: (req: CreateGameRequest) => api.createGame(req, user?.id ?? ''),
    onSuccess: (game) => {
      setStatusMessage(
        isEn
          ? `Game "${game.name}" added to the official catalog!`
          : `Peli "${game.name}" lisätty viralliseen valikoimaan!`
      );
      setErrorMessage(null);
      setNewGameName('');
      setNewGameDesc('');
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to add game.'
          : 'Pelin lisäys epäonnistui.'
      );
    },
  });

  // Hyväksy / vaihda toivelistan tila (Toivelista <-> Asennettu)
  const toggleWishlistMutation = useMutation({
    mutationFn: (gameId: string) => api.toggleWishlistStatus(gameId, user?.id ?? ''),
    onSuccess: (game) => {
      setStatusMessage(
        isEn
          ? `Updated "${game.name}" status (${game.isWishlist ? 'Wishlist' : 'Installed'}).`
          : `Pelin "${game.name}" tila päivitetty (${
              game.isWishlist ? 'Toivelistalla' : 'Virallisessa valikoimassa'
            }).`
      );
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update game status.'
          : 'Pelin tilan päivitys epäonnistui.'
      );
    },
  });

  // Luo tiedote
  const createNewsMutation = useMutation({
    mutationFn: (req: CreateNewsRequest) => api.createNews(req, user?.id ?? ''),
    onSuccess: () => {
      setStatusMessage(
        isEn
          ? 'Announcement published successfully!'
          : 'Uusi tiedote julkaistu onnistuneesti!'
      );
      setErrorMessage(null);
      setNewsTitle('');
      setNewsContent('');
      setNewsIsPinned(false);
      setPreviewNews(false);
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to publish announcement.'
          : 'Tiedotteen julkaisu epäonnistui.'
      );
    },
  });

  // Poista tiedote
  const deleteNewsMutation = useMutation({
    mutationFn: (newsId: string) => api.deleteNews(newsId, user?.id ?? ''),
    onSuccess: () => {
      setStatusMessage(
        isEn ? 'Announcement deleted.' : 'Tiedote poistettu onnistuneesti.'
      );
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to delete announcement.'
          : 'Tiedotteen poisto epäonnistui.'
      );
    },
  });

  // Päivitä käyttäjän rooli (User / Admin)
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role, user?.id ?? ''),
    onSuccess: (updatedUser) => {
      setStatusMessage(
        isEn
          ? `User "${updatedUser.displayName}" role updated to ${updatedUser.role}.`
          : `Käyttäjän "${updatedUser.displayName}" rooli päivitetty: ${updatedUser.role}`
      );
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update user role.'
          : 'Roolin päivitys epäonnistui.'
      );
    },
  });

  // Aseta tai poista käyttäjän määräaikainen/pysyvä käyttöesto (banni)
  const updateUserBanMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: BanUserRequest }) =>
      api.updateUserBan(userId, request, user?.id ?? ''),
    onSuccess: (updatedUser) => {
      if (updatedUser.isBanned) {
        const untilDate = updatedUser.bannedUntilUtc
          ? new Date(updatedUser.bannedUntilUtc)
          : null;
        const isPerm = untilDate && untilDate.getFullYear() >= new Date().getFullYear() + 50;
        const untilFormatted = isPerm
          ? isEn
            ? 'permanently'
            : 'pysyvästi (toistaiseksi)'
          : untilDate?.toLocaleString('fi-FI', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) ?? '';
        setStatusMessage(
          isEn
            ? `User "${updatedUser.displayName}" banned (${untilFormatted}).`
            : `Käyttäjälle "${updatedUser.displayName}" asetettiin käyttöesto (${untilFormatted}).`
        );
      } else {
        setStatusMessage(
          isEn
            ? `Ban removed from user "${updatedUser.displayName}".`
            : `Käyttäjän "${updatedUser.displayName}" käyttöesto (banni) poistettiin.`
        );
      }
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update user ban status.'
          : 'Käyttöeston (bannin) päivitys epäonnistui.'
      );
    },
  });

  // Päivitä sivustoasetukset ja varauskiintiöt
  const updateSettingsMutation = useMutation({
    mutationFn: (req: UpdateSiteSettingsRequest) => api.updateSettings(req, user?.id ?? ''),
    onSuccess: () => {
      const msg = isEn
        ? 'System settings, booking quotas and room policies saved!'
        : 'Järjestelmäasetukset, varauskiintiöt ja tilasäännöt tallennettu onnistuneesti!';
      setStatusMessage(msg);
      setSettingsSuccess(msg);
      setSettingsError(null);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError
        ? err.message
        : isEn
        ? 'Failed to save settings.'
        : 'Asetusten tallennus epäonnistui.';
      setErrorMessage(msg);
      setSettingsError(msg);
      setSettingsSuccess(null);
    },
  });

  // Päivitä yksittäisen pelipisteen käyttötila (Käytössä / Huollossa)
  const updateStationStatusMutation = useMutation({
    mutationFn: ({ stationId, isActive }: { stationId: string; isActive: boolean }) =>
      api.updateStationStatus(stationId, { isActive }, user?.id ?? ''),
    onSuccess: (updatedStation) => {
      const msg = isEn
        ? `Station "${updatedStation.name}" is now ${updatedStation.isActive ? 'ACTIVE' : 'IN MAINTENANCE'}.`
        : `Pelipiste "${updatedStation.name}" on nyt ${updatedStation.isActive ? 'KÄYTÖSSÄ' : 'HUOLTOTILASSA (pois varauksista)'}.`;
      setStatusMessage(msg);
      setSettingsSuccess(msg);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['admin-stations'] });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update station status.'
          : 'Pelipisteen tilan päivitys epäonnistui.'
      );
    },
  });

  // Peruuta yksittäinen varaus ylläpitäjän toimesta
  const adminCancelReservationMutation = useMutation({
    mutationFn: (reservationId: string) =>
      api.cancelReservation(reservationId, {
        userId: user?.id ?? '',
        reason: isEn ? 'Cancelled by Administrator' : 'Ylläpitäjän peruuttama varaus',
      }),
    onSuccess: () => {
      setStatusMessage(
        isEn ? 'Reservation cancelled by Admin.' : 'Varaus peruutettu ylläpitäjän toimesta.'
      );
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-day'] });
      queryClient.invalidateQueries({ queryKey: ['available-stations'] });
      queryClient.invalidateQueries({ queryKey: ['available-now'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to cancel reservation.'
          : 'Varauksen peruutus epäonnistui.'
      );
    },
  });

  // Kuittaa vikailmoitus ratkaistuksi
  const resolveIssueMutation = useMutation({
    mutationFn: ({ issueId, notes }: { issueId: string; notes?: string }) =>
      api.resolveIssueReport(issueId, { adminNotes: notes }, user?.id ?? ''),
    onSuccess: () => {
      setStatusMessage(
        isEn ? 'Issue marked as resolved.' : 'Vikailmoitus merkitty ratkaistuksi.'
      );
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to resolve issue.'
          : 'Vikailmoituksen kuittaus epäonnistui.'
      );
    },
  });

  // Lasketaan KPI-korttien ja suodattimien lukumäärät
  const installedGamesCount = useMemo(
    () => (allGames ?? []).filter((g) => !g.isWishlist).length,
    [allGames]
  );
  const wishlistGamesCount = useMemo(
    () => (allGames ?? []).filter((g) => g.isWishlist).length,
    [allGames]
  );
  const openIssuesCount = useMemo(
    () => (allIssues ?? []).filter((i) => !i.isResolved).length,
    [allIssues]
  );

  // Suodatetaan pelit valitun tilan (kaikki, asennetut, toivelista) ja hakusanan perusteella
  const filteredGames = useMemo(() => {
    const q = gameSearch.trim().toLowerCase();
    return (allGames ?? []).filter((g) => {
      if (gameFilter === 'INSTALLED' && g.isWishlist) return false;
      if (gameFilter === 'WISHLIST' && !g.isWishlist) return false;
      if (q && !g.name.toLowerCase().includes(q) && !g.platform.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [allGames, gameFilter, gameSearch]);

  // Suodatetaan käyttäjät hakusanan (nimi, sähköposti tai rooli) perusteella
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers ?? [];
    return (allUsers ?? []).filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  // Suodatetaan vikailmoitukset tilan (kaikki, avoimet, ratkaistut) mukaan
  const filteredIssues = useMemo(() => {
    return (allIssues ?? []).filter((issue) => {
      if (issueFilter === 'OPEN') return !issue.isResolved;
      if (issueFilter === 'RESOLVED') return issue.isResolved;
      return true;
    });
  }, [allIssues, issueFilter]);

  // Varmistetaan, että vain Admin- tai SuperAdmin-käyttäjät näkevät paneelin
  if (!isAdmin) {
    return (
      <div className="alert alert-error">
        {isEn
          ? 'Only administrators (Admin / SuperAdmin) have access to this control panel.'
          : 'Vain ylläpitäjillä (Admin / SuperAdmin) on pääsy tähän paneeliin.'}
      </div>
    );
  }

  /**
   * Käsittelee uuden pelin lisäämisen lomakkeelta.
   */
  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;
    addGameMutation.mutate({
      name: newGameName.trim(),
      platform: newGamePlatform,
      description: newGameDesc.trim(),
    });
  };

  /**
   * Käsittelee uuden uutistiedotteen julkaisemisen lomakkeelta.
   */
  const handleCreateNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;
    createNewsMutation.mutate({
      title: newsTitle.trim(),
      content: newsContent.trim(),
      authorUserId: user?.id ?? '',
      isPinned: newsIsPinned,
    });
  };

  /**
   * Tallentaa kaikki sivuston asetukset, varauskiintiöt, aukioloajat ja huoltotilan palvelimelle.
   */
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(null);
    setSettingsError(null);
    setTestWebhookStatus(null);

    if (closeTimeHour <= openTimeHour) {
      setSettingsError(
        isEn
          ? 'Closing hour must be after opening hour.'
          : 'Sulkemiskellonajan on oltava avaamiskellonajan jälkeen.'
      );
      return;
    }

    updateSettingsMutation.mutate({
      discordWebhookUrl: discordWebhookUrl.trim(),
      openTimeHour,
      closeTimeHour,
      onlyWeekdays,
      maxAdvanceBookingMonths,
      maxIndividualHours,
      maxStudentRoomHours,
      minReservationMinutes,
      enforceSharedTvLock,
      isMaintenanceMode,
      maintenanceMessage: maintenanceMessage.trim(),
    });
  };

  /**
   * Palauttaa varauskiintiöt ja aukioloajat Xamk Game Roomin oletusarvoihin ja tallentaa ne.
   */
  const handleResetDefaultQuotas = () => {
    setOpenTimeHourDraft(8);
    setCloseTimeHourDraft(18);
    setOnlyWeekdaysDraft(true);
    setMaxAdvanceMonthsDraft(2);
    setMaxIndividualHoursDraft(4);
    setMaxStudentRoomHoursDraft(4);
    setMinReservationMinutesDraft(30);
    setEnforceSharedTvLockDraft(true);
    setIsMaintenanceModeDraft(false);
    setMaintenanceMessageDraft('');
    setSettingsSuccess(null);
    setSettingsError(null);

    updateSettingsMutation.mutate({
      discordWebhookUrl: discordWebhookUrl.trim(),
      openTimeHour: 8,
      closeTimeHour: 18,
      onlyWeekdays: true,
      maxAdvanceBookingMonths: 2,
      maxIndividualHours: 4,
      maxStudentRoomHours: 4,
      minReservationMinutes: 30,
      enforceSharedTvLock: true,
      isMaintenanceMode: false,
      maintenanceMessage: '',
    });
  };

  /**
   * Lähettää testi-ilmoituksen annettuun Discord Webhook -osoitteeseen yhteyden varmistamiseksi.
   */
  const handleTestWebhook = async () => {
    const trimmed = discordWebhookUrl.trim();
    if (!trimmed) {
      setTestWebhookStatus(
        isEn ? 'Please enter a webhook URL first.' : 'Syötä ensin Discord Webhook URL.'
      );
      return;
    }
    setTestWebhookStatus(
      isEn ? 'Sending test notification...' : 'Lähetetään testi-ilmoitusta...'
    );
    try {
      const res = await fetch(trimmed, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🎮 **Xamk Game Room Testi-ilmoitus:** Discord Webhook -yhteys toimii onnistuneesti!',
        }),
      });
      if (res.ok || res.status === 204) {
        setTestWebhookStatus(
          isEn
            ? '✅ Test notification sent to Discord!'
            : '✅ Testi-ilmoitus lähetetty Discordiin onnistuneesti!'
        );
      } else {
        setTestWebhookStatus(
          isEn
            ? `⚠️ Discord returned status ${res.status}`
            : `⚠️ Discord palautti tilakoodin ${res.status}`
        );
      }
    } catch {
      setTestWebhookStatus(
        isEn
          ? '⚠️ Connection to Discord failed (check URL or CORS).'
          : '⚠️ Yhteydenotto Discordiin epäonnistui (tarkista URL).'
      );
    }
  };

  // Ylläpitopaneelin alavälilehtien konfiguraatio
  const subTabs: { id: AdminSubTab; icon: string; labelFi: string; labelEn: string; badge?: number }[] = [
    {
      id: 'games',
      icon: '🎮',
      labelFi: `Pelit & Toivelista (${allGames?.length ?? 0})`,
      labelEn: `Games & Wishlist (${allGames?.length ?? 0})`,
    },
    {
      id: 'news',
      icon: '📰',
      labelFi: `Uutiset (${allNews?.length ?? 0})`,
      labelEn: `News (${allNews?.length ?? 0})`,
    },
    {
      id: 'users',
      icon: '👥',
      labelFi: `Käyttäjät (${allUsers?.length ?? 0})`,
      labelEn: `Users (${allUsers?.length ?? 0})`,
    },
    {
      id: 'settings',
      icon: '⚙️',
      labelFi: 'Asetukset & Discord',
      labelEn: 'Settings & Discord',
    },
    {
      id: 'statistics',
      icon: '📊',
      labelFi: 'Tilastot & Käyttöaste',
      labelEn: 'Statistics & Usage',
    },
    {
      id: 'issues',
      icon: '⚠️',
      labelFi: 'Vikailmoitukset',
      labelEn: 'Issue Reports',
      badge: openIssuesCount,
    },
  ];

  return (
    <div className="xamk-admin-page">
      {/* Top Header Row */}
      <div className="xamk-admin-header">
        <div className="xamk-admin-header-titles">
          <div className="xamk-admin-kicker">XAMK GAME ROOM • ADMIN CONTROL PANEL</div>
          <h2 className="xamk-section-heading" style={{ textAlign: 'left' }}>
            {isEn ? 'Administrator Control Panel' : 'Ylläpitäjän hallintapaneeli'}
          </h2>
          <div className="xamk-section-underline" style={{ margin: '10px 0 12px' }} />
          <p className="xamk-admin-subtitle">
            {isEn
              ? 'Manage the installed game catalog, student wishlist, announcements, user roles, Discord webhooks, usage statistics, and hardware bug reports.'
              : 'Hallinnoi pelivalikoimaa, opiskelijoiden toivelistaa, uutistiedotteita, käyttöoikeuksia, Discord-ilmoituksia sekä laitteiden vikailmoituksia.'}
          </p>
        </div>

        {isSuperAdmin && (
          <div className="xamk-admin-mode-switcher">
            <Button
              type="button"
              variant="station"
              className="xamk-station-card-selected"
              onClick={() => setActiveTab('admin')}
            >
              <div className="xamk-station-card-left">
                <span className="xamk-station-card-icon" aria-hidden="true">⚙️</span>
                <span className="xamk-station-card-name">
                  {isEn ? 'Admin Control Panel' : 'Ylläpitopaneeli'}
                </span>
              </div>
              <Badge variant="status">ACTIVE</Badge>
            </Button>
            <Button
              type="button"
              variant="station"
              onClick={() => setActiveTab('superadmin')}
            >
              <div className="xamk-station-card-left">
                <span className="xamk-station-card-icon" aria-hidden="true">⚡</span>
                <span className="xamk-station-card-name">
                  {isEn ? 'SuperAdmin Event Override' : 'SuperAdmin — Tapahtumajyräys'}
                </span>
              </div>
              <Badge variant="status">OVERRIDE →</Badge>
            </Button>
          </div>
        )}
      </div>

      {/* 4-Card Xamk KPI Strip */}
      <div className="xamk-admin-kpi-grid">
        <button
          type="button"
          className={`xamk-admin-kpi-card btn-touch ${activeSubTab === 'games' ? 'kpi-active' : ''}`}
          onClick={() => setActiveSubTab('games')}
        >
          <div className="xamk-admin-kpi-top">
            <span className="xamk-admin-kpi-label">
              {isEn ? 'Installed Games' : 'Asennetut pelit'}
            </span>
            <span className="xamk-admin-kpi-icon" aria-hidden="true">🎮</span>
          </div>
          <div className="xamk-admin-kpi-value">{installedGamesCount}</div>
          <div className="xamk-admin-kpi-meta">
            ⭐ {wishlistGamesCount} {isEn ? 'on student wishlist' : 'opiskelijoiden toivelistalla'}
          </div>
        </button>

        <button
          type="button"
          className={`xamk-admin-kpi-card btn-touch ${activeSubTab === 'news' ? 'kpi-active' : ''}`}
          onClick={() => setActiveSubTab('news')}
        >
          <div className="xamk-admin-kpi-top">
            <span className="xamk-admin-kpi-label">
              {isEn ? 'Announcements' : 'Julkaistut tiedotteet'}
            </span>
            <span className="xamk-admin-kpi-icon" aria-hidden="true">📰</span>
          </div>
          <div className="xamk-admin-kpi-value">{allNews?.length ?? 0}</div>
          <div className="xamk-admin-kpi-meta">
            📌 {(allNews ?? []).filter((n) => n.isPinned).length}{' '}
            {isEn ? 'pinned to banner' : 'kiinnitettynä yläreunaan'}
          </div>
        </button>

        <button
          type="button"
          className={`xamk-admin-kpi-card btn-touch ${activeSubTab === 'users' ? 'kpi-active' : ''}`}
          onClick={() => setActiveSubTab('users')}
        >
          <div className="xamk-admin-kpi-top">
            <span className="xamk-admin-kpi-label">
              {isEn ? 'Registered Users' : 'Rekisteröidyt käyttäjät'}
            </span>
            <span className="xamk-admin-kpi-icon" aria-hidden="true">👥</span>
          </div>
          <div className="xamk-admin-kpi-value">{allUsers?.length ?? 0}</div>
          <div className="xamk-admin-kpi-meta">
            🛡️ {(allUsers ?? []).filter((u) => u.role.toLowerCase().includes('admin')).length}{' '}
            {isEn ? 'administrators' : 'ylläpitäjää'}
          </div>
        </button>

        <button
          type="button"
          className={`xamk-admin-kpi-card btn-touch ${activeSubTab === 'issues' ? 'kpi-active' : ''}`}
          onClick={() => setActiveSubTab('issues')}
        >
          <div className="xamk-admin-kpi-top">
            <span className="xamk-admin-kpi-label">
              {isEn ? 'Open Bug Reports' : 'Avoimet vikailmoitukset'}
            </span>
            <span className="xamk-admin-kpi-icon" aria-hidden="true">⚠️</span>
          </div>
          <div className="xamk-admin-kpi-value">{openIssuesCount}</div>
          <div className="xamk-admin-kpi-meta">
            ✅ {(allIssues ?? []).filter((i) => i.isResolved).length}{' '}
            {isEn ? 'resolved total' : 'ratkaistua ilmoitusta'}
          </div>
        </button>
      </div>

      {statusMessage && (
        <div className="alert alert-success" role="alert">
          <span>✅</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error" role="alert">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Xamk Sub-navigation Bar */}
      <div className="xamk-admin-tabbar" role="tablist" aria-label="Ylläpidon osiot">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === tab.id}
            className={`xamk-admin-tab-btn btn-touch ${
              activeSubTab === tab.id ? 'admin-tab-active' : ''
            }`}
            onClick={() => {
              setStatusMessage(null);
              setErrorMessage(null);
              setActiveSubTab(tab.id);
            }}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{isEn ? tab.labelEn : tab.labelFi}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="xamk-admin-tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* 1. PELIEN HALLINTA */}
      {activeSubTab === 'games' && (
        <div className="xamk-admin-2col">
          {/* Left Column: Add New Game */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isEn ? 'Add New Game to Catalog' : 'Lisää uusi peli suoraan valikoimaan'}
              </CardTitle>
              <div className="xamk-modal-underline" />
              <CardDescription>
                {isEn
                  ? 'Games added here are immediately marked as installed in the official Xamk Game Room catalog.'
                  : 'Tästä lisätyt pelit merkitään suoraan asennetuiksi Xamk Game Roomin viralliseen pelivalikoimaan.'}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleAddGame} className="xamk-modal-form">
              <div className="xamk-field-group">
                <Label htmlFor="game-name">
                  {isEn ? 'Game Title *' : 'Pelin nimi *'}
                </Label>
                <Input
                  id="game-name"
                  type="text"
                  placeholder="esim. Helldivers 2 / Counter-Strike 2"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  required
                />
              </div>

              <div className="xamk-field-group">
                <Label htmlFor="game-platform">
                  {isEn ? 'Hardware Platform *' : 'Alusta *'}
                </Label>
                <NativeSelect
                  id="game-platform"
                  value={newGamePlatform}
                  onChange={(e) => setNewGamePlatform(e.target.value)}
                >
                  <option value="PC">🖥️ PC</option>
                  <option value="PlayStation5">🎮 PlayStation 5</option>
                  <option value="NintendoSwitch">🕹️ Nintendo Switch</option>
                </NativeSelect>
              </div>

              <div className="xamk-field-group">
                <Label htmlFor="game-desc">
                  {isEn ? 'Short Description' : 'Lyhyt kuvaus'}
                </Label>
                <Textarea
                  id="game-desc"
                  rows={3}
                  placeholder={
                    isEn ? 'Genre, multiplayer info, or notes...' : 'Lyhyt kuvaus pelistä tai pelimuodoista...'
                  }
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                />
              </div>

              <div className="xamk-submit-row" style={{ marginTop: '4px' }}>
                <Button
                  type="submit"
                  variant="pill"
                  disabled={addGameMutation.isPending}
                >
                  <span>
                    {addGameMutation.isPending
                      ? isEn
                        ? 'Saving...'
                        : 'Tallennetaan...'
                      : isEn
                      ? 'Add Game to Catalog'
                      : 'Lisää peli valikoimaan'}
                  </span>
                  <span className="confirm-arrow" aria-hidden="true">→</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Right Column: All Games & Wishlist Management */}
          <Card>
            <div className="xamk-admin-card-header-flex">
              <div>
                <CardTitle>
                  {isEn ? 'Catalog & Wishlist Approval' : 'Kaikki pelit ja toivelistan hyväksyminen'}
                </CardTitle>
                <div className="xamk-modal-underline mt-1.5" />
              </div>

              <Tabs
                value={gameFilter}
                onValueChange={(v) => setGameFilter(v as 'ALL' | 'INSTALLED' | 'WISHLIST')}
              >
                <TabsList className="w-full max-w-[340px]">
                  <TabsTrigger value="ALL">
                    {isEn ? 'All' : 'Kaikki'} ({allGames?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="INSTALLED">
                    {isEn ? 'Installed' : 'Asennetut'} ({installedGamesCount})
                  </TabsTrigger>
                  <TabsTrigger value="WISHLIST">
                    {isEn ? 'Wishlist' : 'Toiveet'} ({wishlistGamesCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="xamk-field-group" style={{ marginBottom: '14px' }}>
              <Input
                type="text"
                placeholder={
                  isEn ? '🔍 Search by game title or platform...' : '🔍 Hae pelin nimellä tai alustalla...'
                }
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isEn ? 'Game' : 'Peli'}</TableHead>
                  <TableHead>{isEn ? 'Platform' : 'Alusta'}</TableHead>
                  <TableHead>{isEn ? 'Votes' : 'Äänet'}</TableHead>
                  <TableHead>{isEn ? 'Status' : 'Tila'}</TableHead>
                  <TableHead>{isEn ? 'Action' : 'Toimenpide'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      <div className="xamk-table-primary-cell">
                        <strong>{game.name}</strong>
                        {game.description && (
                          <span className="xamk-table-subtext">{game.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="xamk-platform-chip">
                        {game.platform === 'PC'
                          ? '🖥️ PC'
                          : game.platform === 'PlayStation5'
                          ? '🎮 PS5'
                          : '🕹️ Switch'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {game.isWishlist ? (
                        <span className="votes-count-badge">🔥 {game.votesCount || 0}</span>
                      ) : (
                        <span className="xamk-table-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={game.isWishlist ? 'wishlist' : 'installed'}>
                        {game.isWishlist
                          ? isEn
                            ? 'Wishlist'
                            : 'Toivelistalla'
                          : isEn
                          ? 'Installed'
                          : 'Asennettu'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className={
                          game.isWishlist
                            ? 'xamk-table-action-btn action-gold btn-touch'
                            : 'xamk-table-action-btn btn-touch'
                        }
                        onClick={() => toggleWishlistMutation.mutate(game.id)}
                        disabled={toggleWishlistMutation.isPending}
                      >
                        {game.isWishlist
                          ? isEn
                            ? '✅ Approve to Catalog'
                            : '✅ Hyväksy valikoimaan'
                          : isEn
                          ? 'Move to Wishlist'
                          : 'Siirrä toivelistalle'}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* 2. UUTISTEN HALLINTA */}
      {activeSubTab === 'news' && (
        <div className="xamk-admin-2col">
          {/* Left Column: Create News */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isEn ? 'Publish New Announcement' : 'Julkaise uusi tiedote'}
              </CardTitle>
              <div className="xamk-modal-underline" />
              <CardDescription>
                {isEn
                  ? 'Announcements appear on the landing page and optionally pinned in the top hero banner.'
                  : 'Tiedotteet näkyvät etusivulla sekä kiinnitettynä pelihuoneen yläbannerissa.'}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleCreateNews} className="xamk-modal-form">
              <div className="xamk-field-group">
                <Label htmlFor="news-title">
                  {isEn ? 'Headline *' : 'Tiedotteen otsikko *'}
                </Label>
                <Input
                  id="news-title"
                  type="text"
                  placeholder="esim. 🏆 Perjantain CS2-turnaus alkaa klo 14!"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  required
                />
              </div>

              <div className="xamk-editor-toolbar">
                <span className="xamk-editor-label">{isEn ? 'Format:' : 'Muotoile:'}</span>
                <button
                  type="button"
                  className="xamk-toolbar-chip btn-touch"
                  onClick={() => setNewsContent((c) => c + ' **lihavoitu teksti**')}
                >
                  <strong>B</strong> {isEn ? 'Bold' : 'Lihavoi'}
                </button>
                <button
                  type="button"
                  className="xamk-toolbar-chip btn-touch"
                  onClick={() => setNewsContent((c) => c + '\n• Kohta 1\n• Kohta 2')}
                >
                  • {isEn ? 'List' : 'Lista'}
                </button>
                <button
                  type="button"
                  className="xamk-toolbar-chip btn-touch"
                  onClick={() => setNewsContent((c) => c + ' [Linkki](https://www.xamk.fi)')}
                >
                  🔗 {isEn ? 'Link' : 'Linkki'}
                </button>
                <button
                  type="button"
                  className={`xamk-toolbar-chip btn-touch ${previewNews ? 'chip-active' : ''}`}
                  onClick={() => setPreviewNews(!previewNews)}
                >
                  👁️ {previewNews ? (isEn ? 'Hide Preview' : 'Piilota esikatselu') : isEn ? 'Preview' : 'Esikatsele'}
                </button>
              </div>

              <div className="xamk-field-group">
                <Label htmlFor="news-content">
                  {isEn ? 'Announcement Content *' : 'Tiedotteen sisältö *'}
                </Label>
                <Textarea
                  id="news-content"
                  rows={5}
                  placeholder={
                    isEn
                      ? 'Write the announcement details...'
                      : 'Kirjoita tiedotteen sisältö. Voit käyttää emoji-ikoneita ja kappalejakoja...'
                  }
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  required
                />
              </div>

              {previewNews && (
                <div className="xamk-landing-news-card card-pinned">
                  <div className="xamk-landing-news-meta">
                    <Badge variant="status">
                      {newsIsPinned ? '📌 Tärkeä tiedote' : '📢 Esikatselu'}
                    </Badge>
                    <time className="xamk-landing-news-date">
                      {new Date().toLocaleDateString('fi-FI')}
                    </time>
                  </div>
                  <h4 className="xamk-landing-news-title">
                    {newsTitle || (isEn ? 'Headline Preview' : 'Tiedotteen otsikko')}
                  </h4>
                  <p className="xamk-landing-news-body" style={{ whiteSpace: 'pre-wrap' }}>
                    {newsContent || (isEn ? 'Content preview...' : 'Tiedotteen sisältöteksti...')}
                  </p>
                </div>
              )}

              <label className="xamk-checkbox-card">
                <input
                  type="checkbox"
                  checked={newsIsPinned}
                  onChange={(e) => setNewsIsPinned(e.target.checked)}
                />
                <div className="xamk-checkbox-text">
                  <strong>
                    📌 {isEn ? 'Pin to Hero Banner & Top of Feed' : 'Kiinnitä tiedote yläbanneriin ja uutislistan kärkeen'}
                  </strong>
                  <span>
                    {isEn
                      ? 'Pinned announcements are highlighted in gold on the welcome banner.'
                      : 'Kiinnitetty tiedote korostetaan kultaisella reunuksella etusivulla.'}
                  </span>
                </div>
              </label>

              <div className="xamk-submit-row">
                <Button
                  type="submit"
                  variant="pill"
                  disabled={createNewsMutation.isPending}
                >
                  <span>
                    {createNewsMutation.isPending
                      ? isEn
                        ? 'Publishing...'
                        : 'Julkaistaan...'
                      : isEn
                      ? 'Publish Announcement'
                      : 'Julkaise tiedote'}
                  </span>
                  <span className="confirm-arrow" aria-hidden="true">→</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Right Column: Published News List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isEn ? 'Published Announcements' : 'Julkaistut tiedotteet'}
              </CardTitle>
              <div className="xamk-modal-underline" />
              <CardDescription>
                {isEn
                  ? 'Manage active announcements currently visible to students and staff.'
                  : 'Hallinnoi opiskelijoille ja henkilökunnalle näkyviä aktiivisia tiedotteita.'}
              </CardDescription>
            </CardHeader>

            <div className="xamk-landing-news-stack">
              {(allNews ?? []).map((news) => (
                <article
                  key={news.id}
                  className={`xamk-landing-news-card ${news.isPinned ? 'card-pinned' : ''}`}
                >
                  <div className="xamk-landing-news-meta">
                    <Badge variant="status">
                      {news.isPinned
                        ? isEn
                          ? '📌 Pinned'
                          : '📌 Kiinnitetty'
                        : isEn
                        ? '📢 Notice'
                        : '📢 Tiedote'}
                    </Badge>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <time className="xamk-landing-news-date">
                        {new Date(news.createdAtUtc).toLocaleDateString('fi-FI')}
                      </time>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteNewsMutation.mutate(news.id)}
                        disabled={deleteNewsMutation.isPending}
                      >
                        🗑️ {isEn ? 'Delete' : 'Poista'}
                      </Button>
                    </div>
                  </div>
                  <h4 className="xamk-landing-news-title">{news.title}</h4>
                  <p className="xamk-landing-news-body">{news.content}</p>
                </article>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 3. KÄYTTÄJIEN, OIKEUKSIEN JA KÄYTTÖESTOJEN (BANNAUKSEN) HALLINTA */}
      {activeSubTab === 'users' && (
        <Card>
          <div className="xamk-admin-card-header-flex">
            <div>
              <CardTitle>
                {isEn
                  ? 'System Users, Access Roles & Ban Controls'
                  : 'Järjestelmäkäyttäjät, Käyttöoikeudet & Bannaus'}
              </CardTitle>
              <div className="xamk-modal-underline mt-1.5 mb-2" />
              <CardDescription>
                {isEn
                  ? 'Manage registered students and staff. Change roles between User and Admin, or apply temporary and permanent bans with custom duration.'
                  : 'Hallinnoi rekisteröityjä opiskelijoita ja henkilökuntaa. Voit muuttaa käyttäjän roolia tai asettaa määräaikaisen/pysyvän käyttöeston (bannin) valitulla kestolla.'}
              </CardDescription>
            </div>

            <div className="xamk-field-group w-full sm:w-auto sm:min-w-[280px]">
              <Input
                type="text"
                placeholder={isEn ? '🔍 Search users by name or email...' : '🔍 Hae nimen tai sähköpostin perusteella...'}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isEn ? 'User & Status' : 'Käyttäjä & Tila'}</TableHead>
                <TableHead>{isEn ? 'Email' : 'Sähköposti'}</TableHead>
                <TableHead>{isEn ? 'Current Role' : 'Nykyinen rooli'}</TableHead>
                <TableHead>{isEn ? 'Change Role' : 'Muuta käyttöoikeutta'}</TableHead>
                <TableHead>
                  {isEn ? 'Ban / Suspension & Duration' : 'Bannaus / Käyttöesto & Pituus'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                // Valittu bannin kesto tälle käyttäjälle (oletuksena 24 tuntia = 1 vrk)
                const selectedDuration = banDurations[u.id] ?? '24';
                const reasonText = banReasons[u.id] ?? u.banReason ?? '';
                const bannedUntilDate = u.bannedUntilUtc ? new Date(u.bannedUntilUtc) : null;
                const isPermanentBan =
                  Boolean(u.isBanned) &&
                  bannedUntilDate !== null &&
                  bannedUntilDate.getFullYear() >= new Date().getFullYear() + 50;

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="xamk-user-row-cell">
                          <span className="xamk-user-row-avatar">
                            {u.displayName.charAt(0).toUpperCase()}
                          </span>
                          <strong>{u.displayName}</strong>
                        </div>
                        <div>
                          {u.isBanned ? (
                            <Badge variant="wishlist">
                              🚫 {isEn ? 'BANNED' : 'BANNATTU / ESTETTY'}
                            </Badge>
                          ) : (
                            <Badge variant="installed">
                              🟢 {isEn ? 'Active' : 'Aktiivinen'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.role === 'SuperAdmin'
                            ? 'wishlist'
                            : u.role === 'Admin'
                            ? 'installed'
                            : 'status'
                        }
                      >
                        {u.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.role === 'SuperAdmin' ? (
                        <span className="xamk-table-muted">
                          ⚡ {isEn ? 'Primary SuperAdmin (locked)' : 'Pääkäyttäjä (pysyvä oikeus)'}
                        </span>
                      ) : !isSuperAdmin ? (
                        <span className="xamk-table-muted">
                          🔒 {isEn ? 'SuperAdmin required' : 'Vaatii SuperAdmin-oikeuden'}
                        </span>
                      ) : (
                        <NativeSelect
                          wrapperClassName="max-w-[200px] min-h-[36px]"
                          value={u.role}
                          onChange={(e) =>
                            updateUserRoleMutation.mutate({ userId: u.id, role: e.target.value })
                          }
                          disabled={updateUserRoleMutation.isPending}
                        >
                          <option value="User">User ({isEn ? 'Student / Staff' : 'Käyttäjä'})</option>
                          <option value="Admin">Admin ({isEn ? 'Administrator' : 'Ylläpitäjä'})</option>
                        </NativeSelect>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role === 'SuperAdmin' ? (
                        <span className="xamk-table-muted">
                          🛡️ {isEn ? 'Cannot be banned' : 'Pääkäyttäjää ei voi bannata'}
                        </span>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            minWidth: '280px',
                            maxWidth: '380px',
                          }}
                        >
                          {/* Näytetään voimassa olevan bannin tiedot ja päättymisaika */}
                          {u.isBanned && (
                            <div
                              style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.14)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                fontSize: '0.78rem',
                                lineHeight: 1.35,
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#fca5a5' }}>
                                ⏳{' '}
                                {isPermanentBan
                                  ? isEn
                                    ? 'Permanent ban active'
                                    : 'Voimassa: Pysyvä esto (toistaiseksi)'
                                  : isEn
                                  ? `Banned until: ${bannedUntilDate?.toLocaleString('fi-FI', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}`
                                  : `Voimassa: ${bannedUntilDate?.toLocaleString('fi-FI', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })} asti`}
                              </div>
                              {u.banReason && (
                                <div className="xamk-table-subtext" style={{ marginTop: '2px' }}>
                                  {isEn ? 'Reason:' : 'Syy:'} {u.banReason}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bannin keston valinta (tunnit / päivät / viikot / kuukaudet / pysyvä) */}
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <NativeSelect
                              aria-label={
                                isEn
                                  ? `Select ban duration for ${u.displayName}`
                                  : `Valitse bannauksen pituus käyttäjälle ${u.displayName}`
                              }
                              wrapperClassName="flex-1 min-w-[165px] min-h-[36px]"
                              value={selectedDuration}
                              onChange={(e) =>
                                setBanDurations((prev) => ({
                                  ...prev,
                                  [u.id]: e.target.value,
                                }))
                              }
                              disabled={updateUserBanMutation.isPending}
                            >
                              <option value="1">{isEn ? '1 hour (1h)' : '1 tunti (1 h)'}</option>
                              <option value="3">{isEn ? '3 hours (3h)' : '3 tuntia (3 h)'}</option>
                              <option value="12">{isEn ? '12 hours (12h)' : '12 tuntia (12 h)'}</option>
                              <option value="24">{isEn ? '24 hours (1 day)' : '1 vuorokausi (24 h)'}</option>
                              <option value="72">{isEn ? '3 days (72h)' : '3 päivää (72 h)'}</option>
                              <option value="168">{isEn ? '1 week (7 days)' : '1 viikko (7 vrk)'}</option>
                              <option value="336">{isEn ? '2 weeks (14 days)' : '2 viikkoa (14 vrk)'}</option>
                              <option value="720">{isEn ? '1 month (30 days)' : '1 kuukausi (30 vrk)'}</option>
                              <option value="2160">{isEn ? '3 months (90 days)' : '3 kuukautta (90 vrk)'}</option>
                              <option value="permanent">
                                {isEn ? 'Permanent ban' : 'Pysyvä esto (Toistaiseksi)'}
                              </option>
                            </NativeSelect>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={updateUserBanMutation.isPending}
                              onClick={() => {
                                const isPerm = selectedDuration === 'permanent';
                                const hours = isPerm ? null : Number(selectedDuration);
                                updateUserBanMutation.mutate({
                                  userId: u.id,
                                  request: {
                                    durationHours: hours,
                                    reason: reasonText.trim() || null,
                                    isPermanent: isPerm,
                                  },
                                });
                              }}
                            >
                              🚫{' '}
                              {u.isBanned
                                ? isEn
                                  ? 'Update Ban'
                                  : 'Päivitä banni'
                                : isEn
                                ? 'Ban User'
                                : 'Bannaa'}
                            </Button>

                            {u.isBanned && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={updateUserBanMutation.isPending}
                                onClick={() =>
                                  updateUserBanMutation.mutate({
                                    userId: u.id,
                                    request: {
                                      durationHours: 0,
                                      reason: null,
                                      isPermanent: false,
                                    },
                                  })
                                }
                              >
                                🔓 {isEn ? 'Unban' : 'Poista banni'}
                              </Button>
                            )}
                          </div>

                          {/* Valinnainen bannauksen syy */}
                          <Input
                            type="text"
                            className="h-8 text-xs"
                            placeholder={
                              isEn
                                ? 'Reason for ban (optional, e.g. rule violation)...'
                                : 'Bannauksen syy (valinnainen, esim. sääntörikkomus)...'
                            }
                            value={reasonText}
                            onChange={(e) =>
                              setBanReasons((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 4. SIVUSTOASETUKSET, VARAUSKIINTIÖT & JÄRJESTELMÄNHALLINTA */}
      {activeSubTab === 'settings' && (
        <div className="xamk-admin-subcontent" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {settingsSuccess && (
            <div className="alert alert-success" role="alert">
              <span>{settingsSuccess}</span>
            </div>
          )}

          {settingsError && (
            <div className="alert alert-error" role="alert">
              <span>{settingsError}</span>
            </div>
          )}

          <div className="xamk-admin-2col">
            {/* VARAUSKIINTIÖT & TILASÄÄNNÖT (INTERAKTIIVINEN HALLINTA) */}
            <Card>
              <CardHeader>
                <CardTitle>
                  📐 {isEn ? 'Active Booking Quotas & Room Policy' : 'Voimassa olevat varauskiintiöt & tilasäännöt'}
                </CardTitle>
                <div className="xamk-modal-underline" />
                <CardDescription>
                  {isEn
                    ? 'Configure opening hours, advance limits, booking quotas and console TV locking enforced by the backend.'
                    : 'Muokkaa varausjärjestelmän palvelimen valvomia aukiolo-, kiintiö- ja laitesääntöjä.'}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSaveSettings} noValidate className="xamk-modal-form">
                <div className="xamk-stations-2col-grid">
                  {/* 1. Aukioloajat */}
                  <div
                    className="xamk-station-row-card"
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', cursor: 'default' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div className="xamk-station-card-left">
                        <span className="xamk-station-card-icon" aria-hidden="true">🕒</span>
                        <div>
                          <div className="xamk-station-card-name">
                            {isEn ? 'Opening Hours' : 'Aukioloajat'}
                          </div>
                          <div className="xamk-table-subtext">
                            {`${String(openTimeHour).padStart(2, '0')}:00 – ${String(closeTimeHour).padStart(2, '0')}:00 (${
                              onlyWeekdays ? (isEn ? 'Mon–Fri' : 'Ma–Pe') : isEn ? 'Mon–Sun' : 'Ma–Su'
                            })`}
                          </div>
                        </div>
                      </div>
                      <Badge variant="status">{onlyWeekdays ? 'MA–PE' : 'MA–SU'}</Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <Label htmlFor="open-hour-select" className="text-xs">
                          {isEn ? 'Opens' : 'Avaus'}
                        </Label>
                        <NativeSelect
                          id="open-hour-select"
                          wrapperClassName="min-h-[36px]"
                          value={String(openTimeHour)}
                          onChange={(e) => {
                            setOpenTimeHourDraft(Number(e.target.value));
                            setSettingsSuccess(null);
                          }}
                        >
                          {[6, 7, 8, 9, 10, 11, 12].map((h) => (
                            <option key={h} value={h}>
                              {`${String(h).padStart(2, '0')}:00`}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>

                      <div>
                        <Label htmlFor="close-hour-select" className="text-xs">
                          {isEn ? 'Closes' : 'Sulku'}
                        </Label>
                        <NativeSelect
                          id="close-hour-select"
                          wrapperClassName="min-h-[36px]"
                          value={String(closeTimeHour)}
                          onChange={(e) => {
                            setCloseTimeHourDraft(Number(e.target.value));
                            setSettingsSuccess(null);
                          }}
                        >
                          {[14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((h) => (
                            <option key={h} value={h}>
                              {`${String(h).padStart(2, '0')}:00`}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="weekdays-select" className="text-xs">
                        {isEn ? 'Open Days' : 'Aukiolopäivät'}
                      </Label>
                      <NativeSelect
                        id="weekdays-select"
                        wrapperClassName="min-h-[36px]"
                        value={onlyWeekdays ? 'weekdays' : 'all'}
                        onChange={(e) => {
                          setOnlyWeekdaysDraft(e.target.value === 'weekdays');
                          setSettingsSuccess(null);
                        }}
                      >
                        <option value="weekdays">
                          {isEn ? 'Weekdays only (Mon–Fri)' : 'Vain arkipäivät (Ma–Pe)'}
                        </option>
                        <option value="all">
                          {isEn ? 'Every day (Mon–Sun)' : 'Kaikki viikonpäivät (Ma–Su)'}
                        </option>
                      </NativeSelect>
                    </div>
                  </div>

                  {/* 2. Ennakkovarausraja */}
                  <div
                    className="xamk-station-row-card"
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', cursor: 'default' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div className="xamk-station-card-left">
                        <span className="xamk-station-card-icon" aria-hidden="true">📅</span>
                        <div>
                          <div className="xamk-station-card-name">
                            {isEn ? 'Advance Window' : 'Ennakkovarausraja'}
                          </div>
                          <div className="xamk-table-subtext">
                            {isEn
                              ? `Up to ${maxAdvanceBookingMonths} months`
                              : `Korkeintaan ${maxAdvanceBookingMonths} kuukautta`}
                          </div>
                        </div>
                      </div>
                      <Badge variant="status">{`MAX ${maxAdvanceBookingMonths} KK`}</Badge>
                    </div>

                    <div>
                      <Label htmlFor="advance-months-select" className="text-xs">
                        {isEn ? 'Max Advance Window' : 'Sallittu ennakkovarausaika'}
                      </Label>
                      <NativeSelect
                        id="advance-months-select"
                        wrapperClassName="min-h-[36px]"
                        value={String(maxAdvanceBookingMonths)}
                        onChange={(e) => {
                          setMaxAdvanceMonthsDraft(Number(e.target.value));
                          setSettingsSuccess(null);
                        }}
                      >
                        {[1, 2, 3, 4, 6, 12].map((m) => (
                          <option key={m} value={m}>
                            {isEn ? `${m} months in advance` : `${m} kuukautta etukäteen`}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>

                  {/* 3. Yksittäisvaraus & Päiväkiintiö */}
                  <div
                    className="xamk-station-row-card"
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', cursor: 'default' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div className="xamk-station-card-left">
                        <span className="xamk-station-card-icon" aria-hidden="true">🎮</span>
                        <div>
                          <div className="xamk-station-card-name">
                            {isEn ? 'Single Station Quota' : 'Yksittäisvaraus'}
                          </div>
                          <div className="xamk-table-subtext">
                            {maxIndividualHours} {isEn ? 'hours / day' : 'tuntia / päivä'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="status">{`MAX ${maxIndividualHours}H`}</Badge>
                    </div>

                    <div>
                      <Label htmlFor="individual-hours-select" className="text-xs">
                        {isEn ? 'Max Daily Quota per Student' : 'Opiskelijan päiväkiintiö & maksimikesto'}
                      </Label>
                      <NativeSelect
                        id="individual-hours-select"
                        wrapperClassName="min-h-[36px]"
                        value={String(maxIndividualHours)}
                        onChange={(e) => {
                          setMaxIndividualHoursDraft(Number(e.target.value));
                          setSettingsSuccess(null);
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10].map((h) => (
                          <option key={h} value={h}>
                            {isEn ? `Max ${h} hours / day` : `Enintään ${h} tuntia / päivä`}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>

                  {/* 4. Opiskelijan tilavaraus */}
                  <div
                    className="xamk-station-row-card"
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', cursor: 'default' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div className="xamk-station-card-left">
                        <span className="xamk-station-card-icon" aria-hidden="true">🏢</span>
                        <div>
                          <div className="xamk-station-card-name">
                            {isEn ? 'Student Room Booking' : 'Opiskelijan tilavaraus'}
                          </div>
                          <div className="xamk-table-subtext">
                            {isEn
                              ? `Up to ${maxStudentRoomHours} hours`
                              : `Enintään ${maxStudentRoomHours} tuntia`}
                          </div>
                        </div>
                      </div>
                      <Badge variant="status">{`MAX ${maxStudentRoomHours}H`}</Badge>
                    </div>

                    <div>
                      <Label htmlFor="room-hours-select" className="text-xs">
                        {isEn ? 'Max Room Booking Duration' : 'Tilavarauksen enimmäiskesto (Opiskelija)'}
                      </Label>
                      <NativeSelect
                        id="room-hours-select"
                        wrapperClassName="min-h-[36px]"
                        value={String(maxStudentRoomHours)}
                        onChange={(e) => {
                          setMaxStudentRoomHoursDraft(Number(e.target.value));
                          setSettingsSuccess(null);
                        }}
                      >
                        {[1, 2, 3, 4, 6, 8, 10].map((h) => (
                          <option key={h} value={h}>
                            {isEn ? `Up to ${h} hours` : `Enintään ${h} tuntia`}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>

                  {/* 5. Varauksen vähimmäiskesto */}
                  <div
                    className="xamk-station-row-card"
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', cursor: 'default' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div className="xamk-station-card-left">
                        <span className="xamk-station-card-icon" aria-hidden="true">⏱️</span>
                        <div>
                          <div className="xamk-station-card-name">
                            {isEn ? 'Minimum Duration' : 'Vähimmäisvaraus'}
                          </div>
                          <div className="xamk-table-subtext">
                            {isEn
                              ? `At least ${minReservationMinutes} minutes`
                              : `Vähintään ${minReservationMinutes} minuuttia`}
                          </div>
                        </div>
                      </div>
                      <Badge variant="status">{`MIN ${minReservationMinutes}M`}</Badge>
                    </div>

                    <div>
                      <Label htmlFor="min-duration-select" className="text-xs">
                        {isEn ? 'Shortest Allowed Slot' : 'Lyhin sallittu varausjakso'}
                      </Label>
                      <NativeSelect
                        id="min-duration-select"
                        wrapperClassName="min-h-[36px]"
                        value={String(minReservationMinutes)}
                        onChange={(e) => {
                          setMinReservationMinutesDraft(Number(e.target.value));
                          setSettingsSuccess(null);
                        }}
                      >
                        <option value="30">{isEn ? '30 minutes' : '30 minuuttia'}</option>
                        <option value="60">{isEn ? '60 minutes (1 hour)' : '60 minuuttia (1 tunti)'}</option>
                        <option value="120">{isEn ? '120 minutes (2 hours)' : '120 minuuttia (2 tuntia)'}</option>
                      </NativeSelect>
                    </div>
                  </div>

                  {/* 6. Konsolien SharedTV-rinnakkaislukko */}
                  <div
                    className="xamk-station-row-card"
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', cursor: 'default' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div className="xamk-station-card-left">
                        <span className="xamk-station-card-icon" aria-hidden="true">📺</span>
                        <div>
                          <div className="xamk-station-card-name">
                            {isEn ? 'SharedTV Console Lock' : 'Konsolien yhteinen TV'}
                          </div>
                          <div className="xamk-table-subtext">
                            {enforceSharedTvLock
                              ? isEn
                                ? 'PS5 & Switch lock each other'
                                : 'PS5 & Switch lukitsevat toisensa'
                              : isEn
                              ? 'Simultaneous console booking allowed'
                              : 'Rinnakkaisvaraus sallittu'}
                          </div>
                        </div>
                      </div>
                      <Badge variant={enforceSharedTvLock ? 'status' : 'installed'}>
                        {enforceSharedTvLock ? (isEn ? 'LOCKED' : 'LUKITTU') : isEn ? 'FREE' : 'VAPAA'}
                      </Badge>
                    </div>

                    <div>
                      <Label htmlFor="shared-tv-select" className="text-xs">
                        {isEn ? 'SharedTV Policy (Rule #6)' : 'Yhteisen television sääntö (Sääntö #6)'}
                      </Label>
                      <NativeSelect
                        id="shared-tv-select"
                        wrapperClassName="min-h-[36px]"
                        value={enforceSharedTvLock ? 'enabled' : 'disabled'}
                        onChange={(e) => {
                          setEnforceSharedTvLockDraft(e.target.value === 'enabled');
                          setSettingsSuccess(null);
                        }}
                      >
                        <option value="enabled">
                          {isEn
                            ? 'Enforced (PS5 and Switch share 1 TV)'
                            : 'Voimassa (PS5 ja Switch jakavat saman TV:n)'}
                        </option>
                        <option value="disabled">
                          {isEn
                            ? 'Disabled (Allow both consoles simultaneously)'
                            : 'Pois käytöstä (Salli molemmat konsolit yhtä aikaa)'}
                        </option>
                      </NativeSelect>
                    </div>
                  </div>
                </div>

                <div className="xamk-submit-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                  <Button
                    type="submit"
                    variant="pill"
                    disabled={updateSettingsMutation.isPending}
                  >
                    <span>
                      {updateSettingsMutation.isPending
                        ? isEn
                          ? 'Saving...'
                          : 'Tallennetaan...'
                        : isEn
                        ? 'Save Quotas & Room Policy'
                        : 'Tallenna kiintiöt & tilasäännöt'}
                    </span>
                    <span className="confirm-arrow" aria-hidden="true">→</span>
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResetDefaultQuotas}
                    disabled={updateSettingsMutation.isPending}
                  >
                    <span>↺ {isEn ? 'Restore Defaults' : 'Palauta oletusarvot'}</span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* OIKEA SARAKE: PELITILAN HUOLTOTILA + DISCORD WEBHOOK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    🛠️ {isEn ? 'Room Operational Status & Maintenance' : 'Pelitilan tila & Poikkeussulku'}
                  </CardTitle>
                  <div className="xamk-modal-underline" />
                  <CardDescription>
                    {isEn
                      ? 'Temporarily lock the Game Room for maintenance, cleaning or equipment upgrades.'
                      : 'Sulje pelihuone tilapäisesti opiskelijavarauksilta esimerkiksi huollon, siivouksen tai päivitysten ajaksi.'}
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSaveSettings} noValidate className="xamk-modal-form">
                  <div className="xamk-field-group">
                    <Label htmlFor="maintenance-mode-select">
                      {isEn ? 'Room Operational Mode' : 'Pelihuoneen toimintatila'}
                    </Label>
                    <NativeSelect
                      id="maintenance-mode-select"
                      value={isMaintenanceMode ? 'maintenance' : 'normal'}
                      onChange={(e) => {
                        setIsMaintenanceModeDraft(e.target.value === 'maintenance');
                        setSettingsSuccess(null);
                      }}
                    >
                      <option value="normal">
                        🟢 {isEn ? 'Open Normally (Student bookings enabled)' : 'Avoinna normaalisti (Opiskelijavaraukset käytössä)'}
                      </option>
                      <option value="maintenance">
                        🟠 {isEn ? 'Maintenance Mode (Block new student bookings)' : 'Huoltotila / Suljettu (Estää uudet opiskelijavaraukset)'}
                      </option>
                    </NativeSelect>
                  </div>

                  <div className="xamk-field-group">
                    <Label htmlFor="maintenance-msg-input">
                      {isEn ? 'Maintenance Notice to Students' : 'Huoltotiedote käyttäjille'}
                    </Label>
                    <Input
                      id="maintenance-msg-input"
                      type="text"
                      placeholder={
                        isEn
                          ? 'e.g., Closed for PC updates until 14:00'
                          : 'esim. Pelihuone on huollossa laitepäivitysten vuoksi klo 14:00 asti.'
                      }
                      value={maintenanceMessage}
                      onChange={(e) => {
                        setMaintenanceMessageDraft(e.target.value);
                        setSettingsSuccess(null);
                      }}
                    />
                  </div>

                  <div className="xamk-submit-row">
                    <Button
                      type="submit"
                      variant="pill"
                      disabled={updateSettingsMutation.isPending}
                    >
                      <span>
                        {isEn ? 'Update Operational Mode' : 'Tallenna tilan toimintatila'}
                      </span>
                      <span className="confirm-arrow" aria-hidden="true">→</span>
                    </Button>
                  </div>
                </form>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    💬 {isEn ? 'Discord Webhook Integration' : 'Discord Webhook & Automaatti-ilmoitukset'}
                  </CardTitle>
                  <div className="xamk-modal-underline" />
                  <CardDescription>
                    {isEn
                      ? 'When an administrator schedules an official tournament or event, the system automatically posts an announcement to your Discord server.'
                      : 'Kun ylläpitäjä luo uuden tapahtuman tai turnauksen pelihuoneeseen, järjestelmä lähettää automaattisen ilmoituksen Discord-kanavallesi.'}
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSaveSettings} noValidate className="xamk-modal-form">
                  {testWebhookStatus && (
                    <div className="alert alert-info" role="alert">
                      <span>{testWebhookStatus}</span>
                    </div>
                  )}

                  <div className="xamk-field-group">
                    <Label htmlFor="webhook-url">Discord Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      type="text"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={discordWebhookUrl}
                      onChange={(e) => {
                        setDiscordWebhookUrl(e.target.value);
                        setSettingsSuccess(null);
                        setSettingsError(null);
                        setTestWebhookStatus(null);
                      }}
                    />
                    <span className="xamk-field-hint">
                      {isEn
                        ? 'Create a webhook in your Discord channel settings (Integrations → Webhooks) and paste the URL above.'
                        : 'Luo webhook Discord-palvelimesi kanavan asetuksista (Integrations → Webhooks) ja liitä URL-osoite tähän.'}
                    </span>
                  </div>

                  <div className="xamk-submit-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Button
                      type="submit"
                      variant="pill"
                      disabled={updateSettingsMutation.isPending}
                    >
                      <span>
                        {updateSettingsMutation.isPending
                          ? isEn
                            ? 'Saving...'
                            : 'Tallennetaan...'
                          : isEn
                          ? 'Save Webhook'
                          : 'Tallenna Webhook'}
                      </span>
                      <span className="confirm-arrow" aria-hidden="true">→</span>
                    </Button>

                    {discordWebhookUrl.trim() && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleTestWebhook}
                        disabled={updateSettingsMutation.isPending}
                        title="Lähetä testi-ilmoitus kanavalle"
                      >
                        <span>💬 {isEn ? 'Test Webhook' : 'Testaa yhteys'}</span>
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            </div>
          </div>

          {/* PELIPISTEIDEN LAITEKOHTAINEN HUOLTO- JA KÄYTTÖTILAHALLINTA */}
          <Card>
            <CardHeader>
              <CardTitle>
                🖥️ {isEn ? 'Gaming Stations Hardware & Maintenance Control' : 'Pelipisteiden laitehallinta & huoltotila (8 laitetta)'}
              </CardTitle>
              <div className="xamk-modal-underline" />
              <CardDescription>
                {isEn
                  ? 'Enable or disable individual gaming stations. Disabled stations are immediately hidden from student bookings during maintenance or repairs.'
                  : 'Hallitse yksittäisten pelipisteiden (PC 1–6, PS5, Switch) käyttötilaa. Huoltotilaan asetettu laite lukitaan välittömästi uusilta varauksilta.'}
              </CardDescription>
            </CardHeader>

            <div className="xamk-stations-2col-grid">
              {(adminStations ?? []).map((st) => (
                <div
                  key={st.id}
                  className="xamk-station-row-card"
                  style={{ cursor: 'default', opacity: st.isActive ? 1 : 0.78 }}
                >
                  <div className="xamk-station-card-left">
                    <span className="xamk-station-card-icon" aria-hidden="true">
                      {st.type === 'PC' ? '🖥️' : '🎮'}
                    </span>
                    <div>
                      <div className="xamk-station-card-name">{st.name}</div>
                      <div className="xamk-table-subtext">
                        {st.type}
                        {st.usesSharedTv ? ' • SharedTV' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Badge variant={st.isActive ? 'installed' : 'wishlist'}>
                      {st.isActive
                        ? isEn
                          ? '🟢 ACTIVE'
                          : '🟢 KÄYTÖSSÄ'
                        : isEn
                        ? '🔧 MAINTENANCE'
                        : '🔧 HUOLLOSSA'}
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
                          ? 'Set Maintenance'
                          : 'Aseta huoltoon'
                        : isEn
                        ? 'Restore Active'
                        : 'Palauta käyttöön'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* VOIMASSA OLEVIEN VARAUSTEN HALLINTA JA PERUUTUS (ADMIN) */}
          <Card>
            <CardHeader>
              <CardTitle>
                📋 {isEn ? 'Active Reservations Management (Next 14 Days)' : 'Voimassa olevien varausten hallinta (Seuraavat 14 vrk)'}
              </CardTitle>
              <div className="xamk-modal-underline" />
              <CardDescription>
                {isEn
                  ? 'Review upcoming student and room reservations and cancel bookings if needed due to schedule changes or device maintenance.'
                  : 'Tarkastele tulevia aktiivisia varauksia ja peruuta yksittäinen varaus tarvittaessa esimerkiksi laitehuollon tai opiskelijan pyynnön vuoksi.'}
              </CardDescription>
            </CardHeader>

            {(upcomingReservations ?? []).length === 0 ? (
              <div className="xamk-table-muted" style={{ padding: '14px 0' }}>
                {isEn
                  ? 'No active reservations for the next 14 days.'
                  : 'Ei aktiivisia varauksia seuraavan 14 vuorokauden aikana.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isEn ? 'Time Window' : 'Ajankohta'}</TableHead>
                    <TableHead>{isEn ? 'Target / Type' : 'Kohde / Tyyppi'}</TableHead>
                    <TableHead>{isEn ? 'Booked By' : 'Varaaja'}</TableHead>
                    <TableHead>{isEn ? 'Action' : 'Toiminto'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(upcomingReservations ?? []).slice(0, 20).map((r) => {
                    const stName =
                      (adminStations ?? []).find((s) => s.id === r.gamingStationId)?.name ??
                      (r.reservationType === 'Room'
                        ? isEn
                          ? 'Full Game Room'
                          : 'Koko pelitila'
                        : r.reservationType === 'Event'
                        ? isEn
                          ? 'Official Event'
                          : 'Tapahtuma / Turnaus'
                        : r.reservationType);
                    const startD = new Date(r.startUtc);
                    const endD = new Date(r.endUtc);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <strong>{startD.toLocaleDateString('fi-FI')}</strong>{' '}
                          <span className="xamk-table-subtext">
                            {startD.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })} –{' '}
                            {endD.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="status">{stName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>{r.bookerName || (isEn ? 'Student' : 'Opiskelija')}</div>
                          {r.bookerEmail && <div className="xamk-table-subtext">{r.bookerEmail}</div>}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={adminCancelReservationMutation.isPending}
                            onClick={() => adminCancelReservationMutation.mutate(r.id)}
                          >
                            🗑️ {isEn ? 'Cancel' : 'Peru varaus'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* 5. STATISTIIKKA & KÄYTTÖASTE */}
      {activeSubTab === 'statistics' && (
        <div className="xamk-admin-subcontent">
          <div className="xamk-admin-kpi-grid" style={{ marginBottom: '20px' }}>
            <div className="xamk-admin-kpi-card" style={{ cursor: 'default' }}>
              <div className="xamk-admin-kpi-top">
                <span className="xamk-admin-kpi-label">
                  {isEn ? 'Total Reservations' : 'Kokonaisvaraukset'}
                </span>
                <span className="xamk-admin-kpi-icon">📅</span>
              </div>
              <div className="xamk-admin-kpi-value">{statistics?.totalReservations ?? 0}</div>
              <div className="xamk-admin-kpi-meta">
                {isEn ? 'All-time recorded bookings' : 'Kaikki järjestelmän varaukset'}
              </div>
            </div>

            <div className="xamk-admin-kpi-card" style={{ cursor: 'default' }}>
              <div className="xamk-admin-kpi-top">
                <span className="xamk-admin-kpi-label">
                  {isEn ? 'Active Reservations' : 'Aktiiviset varaukset'}
                </span>
                <span className="xamk-admin-kpi-icon">🟢</span>
              </div>
              <div className="xamk-admin-kpi-value">{statistics?.activeReservations ?? 0}</div>
              <div className="xamk-admin-kpi-meta">
                {isEn ? 'Upcoming & ongoing sessions' : 'Voimassa olevat varaukset'}
              </div>
            </div>

            <div className="xamk-admin-kpi-card" style={{ cursor: 'default' }}>
              <div className="xamk-admin-kpi-top">
                <span className="xamk-admin-kpi-label">
                  {isEn ? 'Total Users' : 'Käyttäjämäärä'}
                </span>
                <span className="xamk-admin-kpi-icon">👥</span>
              </div>
              <div className="xamk-admin-kpi-value">{statistics?.totalUsers ?? 0}</div>
              <div className="xamk-admin-kpi-meta">
                {isEn ? 'Verified Xamk accounts' : 'Vahvistetut Xamk-tunnukset'}
              </div>
            </div>

            <div className="xamk-admin-kpi-card" style={{ cursor: 'default' }}>
              <div className="xamk-admin-kpi-top">
                <span className="xamk-admin-kpi-label">
                  {isEn ? 'Catalog Games' : 'Asennetut pelit'}
                </span>
                <span className="xamk-admin-kpi-icon">🎮</span>
              </div>
              <div className="xamk-admin-kpi-value">{statistics?.totalGames ?? 0}</div>
              <div className="xamk-admin-kpi-meta">
                {isEn ? 'Available across PC, PS5 & Switch' : 'PC-, PS5- ja Switch-pelit'}
              </div>
            </div>
          </div>

          <div className="xamk-admin-2col">
            <Card>
              <CardHeader>
                <CardTitle>
                  📊 {isEn ? 'Station Utilization & Hours' : 'Pelipisteiden käyttöaste & varausmäärät'}
                </CardTitle>
                <div className="xamk-modal-underline" />
              </CardHeader>
              <div className="station-stats-list" style={{ marginTop: '6px' }}>
                {statistics?.stationUsage?.map((st) => (
                  <div key={st.stationId} className="station-stat-row">
                    <div className="station-stat-meta">
                      <span className="st-name">
                        {st.stationType === 'PC' ? '🖥️' : '🎮'} {st.stationName}
                      </span>
                      <span className="st-numbers">
                        {st.reservationCount} {isEn ? 'bookings' : 'varausta'} • {st.totalHours}{' '}
                        {isEn ? 'hrs' : 'tuntia'}
                      </span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
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

            <Card>
              <CardHeader>
                <CardTitle>
                  📑 {isEn ? 'Reservations by Type' : 'Varausten jakautuminen tyypeittäin'}
                </CardTitle>
                <div className="xamk-modal-underline" />
              </CardHeader>
              <div className="xamk-stations-2col-grid" style={{ marginTop: '6px' }}>
                {statistics?.typeBreakdown?.map((tb) => (
                  <div key={tb.reservationType} className="xamk-station-row-card" style={{ cursor: 'default' }}>
                    <div className="xamk-station-card-left">
                      <span className="xamk-station-card-icon">
                        {tb.reservationType === 'Individual'
                          ? '🎮'
                          : tb.reservationType === 'Room'
                          ? '🏢'
                          : '🏆'}
                      </span>
                      <span className="xamk-station-card-name">
                        {tb.reservationType === 'Individual'
                          ? isEn
                            ? 'Single Station'
                            : 'Yksittäisvaraukset'
                          : tb.reservationType === 'Room'
                          ? isEn
                            ? 'Whole Room'
                            : 'Tilavaraukset'
                          : isEn
                          ? 'Events'
                          : 'Tapahtumat'}
                      </span>
                    </div>
                    <Badge variant="status">{tb.count} KPL</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 6. VIKAILMOITUSTEN HALLINTA */}
      {activeSubTab === 'issues' && (
        <Card>
          <div className="xamk-admin-card-header-flex">
            <div>
              <CardTitle>
                ⚠️ {isEn ? 'Hardware & Software Issue Reports' : 'Saapuneet vika- ja virheilmoitukset'}
              </CardTitle>
              <div className="xamk-modal-underline mt-1.5 mb-2" />
              <CardDescription>
                {isEn
                  ? 'Review and resolve student reports regarding gaming stations, peripherals, or room condition.'
                  : 'Opiskelijoiden ja käyttäjien lähettämät ilmoitukset laitevioista, ohjelmisto-ongelmista ja tilan kunnosta.'}
              </CardDescription>
            </div>

            <Tabs
              value={issueFilter}
              onValueChange={(v) => setIssueFilter(v as 'ALL' | 'OPEN' | 'RESOLVED')}
            >
              <TabsList className="w-full max-w-[340px]">
                <TabsTrigger value="ALL">
                  {isEn ? 'All' : 'Kaikki'} ({allIssues?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="OPEN">
                  🟡 {isEn ? 'Open' : 'Avoimet'} ({openIssuesCount})
                </TabsTrigger>
                <TabsTrigger value="RESOLVED">
                  🟢 {isEn ? 'Resolved' : 'Ratkaistut'} ({(allIssues?.length ?? 0) - openIssuesCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="empty-state">
              <p>
                {isEn
                  ? 'No issue reports matching the selected filter.'
                  : 'Ei rekisteröityjä vikailmoituksia valitulla suodattimella.'}
              </p>
            </div>
          ) : (
            <div className="issues-list">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`issue-card ${issue.isResolved ? 'issue-resolved' : 'issue-open'}`}
                >
                  <div className="issue-card-header">
                    <div className="issue-meta">
                      <span className="target-tag">🖥️ {issue.target}</span>
                      <Badge variant={issue.isResolved ? 'installed' : 'wishlist'}>
                        {issue.isResolved
                          ? isEn
                            ? '🟢 RESOLVED'
                            : '🟢 RATKAISTU'
                          : isEn
                          ? '🟡 OPEN'
                          : '🟡 AVOIN'}
                      </Badge>
                      <time className="issue-date">
                        {new Date(issue.createdAt).toLocaleDateString('fi-FI', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>

                    {issue.reporterEmail && (
                      <div className="issue-reporter">
                        👤 {issue.reporterName || (isEn ? 'Student' : 'Opiskelija')} ({issue.reporterEmail})
                      </div>
                    )}
                  </div>

                  <h4 className="issue-title">{issue.title}</h4>
                  <p className="issue-desc">{issue.description}</p>

                  {issue.isResolved ? (
                    <div className="issue-resolution-info">
                      <strong>{isEn ? 'Resolution:' : 'Ratkaistu:'}</strong>{' '}
                      {issue.adminNotes || (isEn ? 'Marked resolved without additional notes.' : 'Kuitattu ilman lisähuomioita.')}
                      {issue.resolvedAt && (
                        <span className="resolution-date">
                          {' '}
                          (
                          {new Date(issue.resolvedAt).toLocaleDateString('fi-FI', {
                            day: 'numeric',
                            month: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          )
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="xamk-issue-resolve-row">
                      <div style={{ flex: 1 }}>
                        <Input
                          type="text"
                          placeholder={
                            isEn
                              ? 'Add resolution note (e.g., replaced cable / updated driver)...'
                              : 'Kirjaa toimenpide (esim. näytön kaapeli vaihdettu)...'
                          }
                          value={resolveNotes[issue.id] || ''}
                          onChange={(e) =>
                            setResolveNotes((prev) => ({ ...prev, [issue.id]: e.target.value }))
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="pill"
                        onClick={() =>
                          resolveIssueMutation.mutate({
                            issueId: issue.id,
                            notes: resolveNotes[issue.id]?.trim(),
                          })
                        }
                        disabled={resolveIssueMutation.isPending}
                      >
                        <span>
                          ✅ {isEn ? 'Mark Resolved' : 'Merkitse ratkaistuksi'}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
