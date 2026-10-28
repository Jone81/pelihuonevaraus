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
import type { CreateGameRequest, CreateNewsRequest, UpdateSiteSettingsRequest } from '../types';

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

  // Käyttäjien haku
  const [userSearch, setUserSearch] = useState('');

  // Asetukset
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');

  // Vikailmoitusten suodatus & kuittausmuistiinpanot
  const [issueFilter, setIssueFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({});

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kyselyt
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
    queryFn: () => api.getAllUsers(),
    enabled: isAdmin,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const data = await api.getSettings();
      setDiscordWebhookUrl(data.discordWebhookUrl || '');
      return data;
    },
    enabled: isAdmin && activeSubTab === 'settings',
  });

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

  // Lisää peli
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

  // Hyväksy / vaihda toivelistan tila
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

  // Päivitä käyttäjän rooli
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role),
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

  // Päivitä sivustoasetukset
  const updateSettingsMutation = useMutation({
    mutationFn: (req: UpdateSiteSettingsRequest) => api.updateSettings(req),
    onSuccess: () => {
      setStatusMessage(
        isEn
          ? 'Site settings and Discord webhook saved!'
          : 'Sivustoasetukset ja Discord Webhook tallennettu onnistuneesti!'
      );
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to save settings.'
          : 'Asetusten tallennus epäonnistui.'
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

  const filteredIssues = useMemo(() => {
    return (allIssues ?? []).filter((issue) => {
      if (issueFilter === 'OPEN') return !issue.isResolved;
      if (issueFilter === 'RESOLVED') return issue.isResolved;
      return true;
    });
  }, [allIssues, issueFilter]);

  if (!isAdmin) {
    return (
      <div className="alert alert-error">
        {isEn
          ? 'Only administrators (Admin / SuperAdmin) have access to this control panel.'
          : 'Vain ylläpitäjillä (Admin / SuperAdmin) on pääsy tähän paneeliin.'}
      </div>
    );
  }

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;
    addGameMutation.mutate({
      name: newGameName.trim(),
      platform: newGamePlatform,
      description: newGameDesc.trim(),
    });
  };

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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      discordWebhookUrl: discordWebhookUrl.trim(),
    });
  };

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
                <TabsList style={{ maxWidth: '340px' }}>
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

      {/* 3. KÄYTTÄJIEN JA OIKEUKSIEN HALLINTA */}
      {activeSubTab === 'users' && (
        <Card>
          <div className="xamk-admin-card-header-flex">
            <div>
              <CardTitle>
                {isEn ? 'System Users & Access Roles' : 'Järjestelmäkäyttäjät & Käyttöoikeudet'}
              </CardTitle>
              <div className="xamk-modal-underline mt-1.5 mb-2" />
              <CardDescription>
                {isEn
                  ? 'Manage registered students and staff. Promote or demote accounts between User and Admin.'
                  : 'Hallinnoi rekisteröityjä opiskelijoita ja henkilökuntaa. Voit vaihtaa käyttäjän roolin User- ja Admin-tasojen välillä.'}
              </CardDescription>
            </div>

            <div className="xamk-field-group" style={{ minWidth: '280px' }}>
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
                <TableHead>{isEn ? 'User' : 'Käyttäjä'}</TableHead>
                <TableHead>{isEn ? 'Email' : 'Sähköposti'}</TableHead>
                <TableHead>{isEn ? 'Current Role' : 'Nykyinen rooli'}</TableHead>
                <TableHead>{isEn ? 'Change Role' : 'Muuta käyttöoikeutta'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="xamk-user-row-cell">
                      <span className="xamk-user-row-avatar">
                        {u.displayName.charAt(0).toUpperCase()}
                      </span>
                      <strong>{u.displayName}</strong>
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
                    ) : (
                      <NativeSelect
                        wrapperClassName="max-w-[220px] min-h-[36px]"
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 4. SIVUSTOASETUKSET & DISCORD */}
      {activeSubTab === 'settings' && (
        <div className="xamk-admin-2col">
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

            <form onSubmit={handleSaveSettings} className="xamk-modal-form">
              <div className="xamk-field-group">
                <Label htmlFor="webhook-url">Discord Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                />
                <span className="xamk-field-hint">
                  {isEn
                    ? 'Create a webhook in your Discord channel settings (Integrations → Webhooks) and paste the URL above.'
                    : 'Luo webhook Discord-palvelimesi kanavan asetuksista (Integrations → Webhooks) ja liitä URL-osoite tähän.'}
                </span>
              </div>

              <div className="xamk-submit-row">
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
                      ? 'Save Configuration'
                      : 'Tallenna asetukset'}
                  </span>
                  <span className="confirm-arrow" aria-hidden="true">→</span>
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                📐 {isEn ? 'Active Booking Quotas & Room Policy' : 'Voimassa olevat varauskiintiöt & tilasäännöt'}
              </CardTitle>
              <div className="xamk-modal-underline" />
              <CardDescription>
                {isEn
                  ? 'Core reservation parameters enforced automatically by the Xamk Game Room backend.'
                  : 'Varausjärjestelmän palvelimen automaattisesti valvomat aukiolo- ja kiintiösäännöt.'}
              </CardDescription>
            </CardHeader>

            <div className="xamk-stations-2col-grid">
              <div className="xamk-station-row-card" style={{ cursor: 'default' }}>
                <div className="xamk-station-card-left">
                  <span className="xamk-station-card-icon" aria-hidden="true">🕒</span>
                  <div>
                    <div className="xamk-station-card-name">
                      {isEn ? 'Opening Hours' : 'Aukioloajat'}
                    </div>
                    <div className="xamk-table-subtext">
                      {settings?.openingHoursText || '08:00 – 18:00 (Ma–Pe)'}
                    </div>
                  </div>
                </div>
                <Badge variant="status">MA–PE</Badge>
              </div>

              <div className="xamk-station-row-card" style={{ cursor: 'default' }}>
                <div className="xamk-station-card-left">
                  <span className="xamk-station-card-icon" aria-hidden="true">📅</span>
                  <div>
                    <div className="xamk-station-card-name">
                      {isEn ? 'Advance Window' : 'Ennakkovarausraja'}
                    </div>
                    <div className="xamk-table-subtext">
                      {isEn
                        ? `Up to ${settings?.maxAdvanceBookingMonths || 2} months`
                        : `Korkeintaan ${settings?.maxAdvanceBookingMonths || 2} kuukautta`}
                    </div>
                  </div>
                </div>
                <Badge variant="status">MAX 2 KK</Badge>
              </div>

              <div className="xamk-station-row-card" style={{ cursor: 'default' }}>
                <div className="xamk-station-card-left">
                  <span className="xamk-station-card-icon" aria-hidden="true">🎮</span>
                  <div>
                    <div className="xamk-station-card-name">
                      {isEn ? 'Single Station Quota' : 'Yksittäisvaraus'}
                    </div>
                    <div className="xamk-table-subtext">
                      {settings?.maxIndividualHours || 4} {isEn ? 'hours / day' : 'tuntia / päivä'}
                    </div>
                  </div>
                </div>
                <Badge variant="status">MAX 4H</Badge>
              </div>

              <div className="xamk-station-row-card" style={{ cursor: 'default' }}>
                <div className="xamk-station-card-left">
                  <span className="xamk-station-card-icon" aria-hidden="true">🏢</span>
                  <div>
                    <div className="xamk-station-card-name">
                      {isEn ? 'Student Room Booking' : 'Opiskelijan tilavaraus'}
                    </div>
                    <div className="xamk-table-subtext">
                      {isEn
                        ? `Up to ${settings?.maxStudentRoomHours || 4} hours`
                        : `Enintään ${settings?.maxStudentRoomHours || 4} tuntia`}
                    </div>
                  </div>
                </div>
                <Badge variant="status">MAX 4H</Badge>
              </div>
            </div>
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
              <TabsList style={{ maxWidth: '340px' }}>
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
