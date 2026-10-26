import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CreateGameRequest, CreateNewsRequest, UpdateSiteSettingsRequest } from '../types';

type AdminSubTab = 'games' | 'news' | 'users' | 'settings' | 'statistics' | 'issues';

export const AdminPanel: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('games');

  // Pelien lisäys
  const [newGameName, setNewGameName] = useState('');
  const [newGamePlatform, setNewGamePlatform] = useState('PC');
  const [newGameDesc, setNewGameDesc] = useState('');

  // Tiedotteiden lisäys
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsIsPinned, setNewsIsPinned] = useState(false);
  const [previewNews, setPreviewNews] = useState(false);

  // Asetukset
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');

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
    enabled: isAdmin && activeSubTab === 'users',
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
      setStatusMessage(`Peli "${game.name}" lisätty viralliseen valikoimaan!`);
      setErrorMessage(null);
      setNewGameName('');
      setNewGameDesc('');
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Pelin lisäys epäonnistui.');
    },
  });

  // Hyväksy / vaihda toivelistan tila
  const toggleWishlistMutation = useMutation({
    mutationFn: (gameId: string) => api.toggleWishlistStatus(gameId, user?.id ?? ''),
    onSuccess: (game) => {
      setStatusMessage(`Pelin "${game.name}" toivelistatila päivitetty (${game.isWishlist ? 'Toivelistalla' : 'Virallisessa valikoimassa'}).`);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Pelin tilan päivitys epäonnistui.');
    },
  });

  // Luo tiedote
  const createNewsMutation = useMutation({
    mutationFn: (req: CreateNewsRequest) => api.createNews(req, user?.id ?? ''),
    onSuccess: () => {
      setStatusMessage('Uusi tiedote julkaistu onnistuneesti!');
      setErrorMessage(null);
      setNewsTitle('');
      setNewsContent('');
      setNewsIsPinned(false);
      setPreviewNews(false);
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Tiedotteen julkaisu epäonnistui.');
    },
  });

  // Poista tiedote
  const deleteNewsMutation = useMutation({
    mutationFn: (newsId: string) => api.deleteNews(newsId, user?.id ?? ''),
    onSuccess: () => {
      setStatusMessage('Tiedote poistettu onnistuneesti.');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Tiedotteen poisto epäonnistui.');
    },
  });

  // Päivitä käyttäjän rooli
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role),
    onSuccess: (updatedUser) => {
      setStatusMessage(`Käyttäjän "${updatedUser.displayName}" rooli päivitetty: ${updatedUser.role}`);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Roolin päivitys epäonnistui.');
    },
  });

  // Päivitä sivustoasetukset
  const updateSettingsMutation = useMutation({
    mutationFn: (req: UpdateSiteSettingsRequest) => api.updateSettings(req),
    onSuccess: () => {
      setStatusMessage('Sivustoasetukset ja Discord Webhook tallennettu onnistuneesti!');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Asetusten tallennus epäonnistui.');
    },
  });

  // Kuittaa vikailmoitus ratkaistuksi
  const resolveIssueMutation = useMutation({
    mutationFn: ({ issueId, notes }: { issueId: string; notes?: string }) =>
      api.resolveIssueReport(issueId, { adminNotes: notes }, user?.id ?? ''),
    onSuccess: () => {
      setStatusMessage('Vikailmoitus merkitty ratkaistuksi.');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Vikailmoituksen kuittaus epäonnistui.');
    },
  });

  if (!isAdmin) {
    return (
      <div className="alert alert-error">
        Vain ylläpitäjillä (Admin / SuperAdmin) on pääsy tähän paneeliin.
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

  return (
    <div className="admin-panel-container">
      <div className="section-header">
        <div>
          <h2>⚙️ Ylläpitäjän hallintapaneeli</h2>
          <p className="section-description">
            Hallinnoi pelivalikoimaa, julkaise uutisia, muokkaa käyttöoikeuksia, konfiguroi Discord-ilmoituksia ja seuraa varaustilastoja.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="alert alert-success" role="alert">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Alavalikko */}
      <div className="admin-subtabs">
        <button
          type="button"
          className={`subtab-btn btn-touch ${activeSubTab === 'games' ? 'subtab-active' : ''}`}
          onClick={() => setActiveSubTab('games')}
        >
          🎮 Pelit ({allGames?.length ?? 0})
        </button>
        <button
          type="button"
          className={`subtab-btn btn-touch ${activeSubTab === 'news' ? 'subtab-active' : ''}`}
          onClick={() => setActiveSubTab('news')}
        >
          📰 Uutiset ({allNews?.length ?? 0})
        </button>
        <button
          type="button"
          className={`subtab-btn btn-touch ${activeSubTab === 'users' ? 'subtab-active' : ''}`}
          onClick={() => setActiveSubTab('users')}
        >
          👥 Käyttäjät ({allUsers?.length ?? '...'})
        </button>
        <button
          type="button"
          className={`subtab-btn btn-touch ${activeSubTab === 'settings' ? 'subtab-active' : ''}`}
          onClick={() => setActiveSubTab('settings')}
        >
          ⚙️ Asetukset & Discord
        </button>
        <button
          type="button"
          className={`subtab-btn btn-touch ${activeSubTab === 'statistics' ? 'subtab-active' : ''}`}
          onClick={() => setActiveSubTab('statistics')}
        >
          📊 Statistiikka
        </button>
        <button
          type="button"
          className={`subtab-btn btn-touch ${activeSubTab === 'issues' ? 'subtab-active' : ''}`}
          onClick={() => setActiveSubTab('issues')}
          style={{ position: 'relative' }}
        >
          ⚠️ Vikailmoitukset
          {(allIssues?.filter((i) => !i.isResolved).length ?? 0) > 0 && (
            <span className="badge-counter badge-danger" style={{ marginLeft: '0.4rem' }}>
              {allIssues?.filter((i) => !i.isResolved).length}
            </span>
          )}
        </button>
      </div>

      {/* 1. PELIEN HALLINTA */}
      {activeSubTab === 'games' && (
        <div className="admin-subcontent">
          <div className="admin-card">
            <h3>➕ Lisää uusi peli suoraan valikoimaan</h3>
            <form onSubmit={handleAddGame} className="form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="game-name">Pelin nimi</label>
                  <input
                    id="game-name"
                    type="text"
                    className="input-touch"
                    placeholder="esim. Helldivers 2"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="game-platform">Alusta</label>
                  <select
                    id="game-platform"
                    className="input-touch"
                    value={newGamePlatform}
                    onChange={(e) => setNewGamePlatform(e.target.value)}
                  >
                    <option value="PC">🖥️ PC</option>
                    <option value="PlayStation5">🎮 PlayStation 5</option>
                    <option value="NintendoSwitch">🕹️ Nintendo Switch</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="game-desc">Kuvaus</label>
                <textarea
                  id="game-desc"
                  className="input-touch textarea-touch"
                  rows={2}
                  placeholder="Lyhyt kuvaus pelistä..."
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-touch"
                disabled={addGameMutation.isPending}
              >
                {addGameMutation.isPending ? 'Tallennetaan...' : 'Lisää peli valikoimaan'}
              </button>
            </form>
          </div>

          <div className="admin-card">
            <h3>🎮 Kaikki pelit ja toivelistan hyväksyminen</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nimi</th>
                    <th>Alusta</th>
                    <th>Äänet</th>
                    <th>Tila</th>
                    <th>Toimenpiteet</th>
                  </tr>
                </thead>
                <tbody>
                  {allGames?.map((game) => (
                    <tr key={game.id}>
                      <td><strong>{game.name}</strong></td>
                      <td>{game.platform}</td>
                      <td>
                        {game.isWishlist ? (
                          <span className="votes-count-badge">🔥 {game.votesCount || 0}</span>
                        ) : (
                          <span style={{ color: '#888' }}>—</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={game.isWishlist ? 'warning' : 'success'} className="text-xs">
                          {game.isWishlist ? '💡 Toivelistalla' : '✅ Asennettu'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant={game.isWishlist ? 'xamk' : 'secondary'}
                          size="sm"
                          className="btn-touch text-xs"
                          onClick={() => toggleWishlistMutation.mutate(game.id)}
                          disabled={toggleWishlistMutation.isPending}
                        >
                          {game.isWishlist ? '✅ Hyväksy valikoimaan' : 'Siirrä toivelistalle'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. UUTISTEN HALLINTA & HTML/MARKDOWN -EDITORI */}
      {activeSubTab === 'news' && (
        <div className="admin-subcontent">
          <div className="admin-card">
            <h3>📰 Julkaise uusi tiedote (Rikas tekstieditori)</h3>
            <form onSubmit={handleCreateNews} className="form">
              <div className="form-group">
                <label htmlFor="news-title">Tiedotteen otsikko</label>
                <input
                  id="news-title"
                  type="text"
                  className="input-touch"
                  placeholder="esim. 🏆 Perjantain turnaus alkaa klo 14!"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  required
                />
              </div>

              {/* Rikas editori -työkalupalkki */}
              <div className="editor-toolbar">
                <span className="editor-toolbar-label">Muotoile:</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-touch btn-small"
                  onClick={() => setNewsContent((c) => c + ' **lihavoitu teksti**')}
                >
                  <strong>B</strong> Lihavoi
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-touch btn-small"
                  onClick={() => setNewsContent((c) => c + '\n- Lista-asia 1\n- Lista-asia 2')}
                >
                  • Lista
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-touch btn-small"
                  onClick={() => setNewsContent((c) => c + ' [Linkkiteksti](https://...)')}
                >
                  🔗 Linkki
                </button>
                <button
                  type="button"
                  className={`btn btn-secondary btn-touch btn-small ${previewNews ? 'btn-active' : ''}`}
                  onClick={() => setPreviewNews(!previewNews)}
                >
                  👁️ {previewNews ? 'Piilota esikatselu' : 'Esikatsele'}
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="news-content">Sisältö</label>
                <textarea
                  id="news-content"
                  className="input-touch textarea-touch"
                  rows={5}
                  placeholder="Kirjoita tiedotteen teksti. Voit käyttää emoji-ikoneita ja muotoiluja..."
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  required
                />
              </div>

              {previewNews && (
                <div className="news-preview-box">
                  <span className="preview-label">Esikatselu käyttäjille:</span>
                  <h4>{newsTitle || 'Tiedotteen otsikko'}</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{newsContent || 'Sisältöteksti...'}</p>
                </div>
              )}

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newsIsPinned}
                    onChange={(e) => setNewsIsPinned(e.target.checked)}
                  />
                  <span>📌 Kiinnitä tiedote sivuston yläreunan huomiopalkkiin</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="xamk"
                className="btn-touch font-bold"
                disabled={createNewsMutation.isPending}
              >
                {createNewsMutation.isPending ? 'Julkaistaan...' : 'Julkaise tiedote'}
              </Button>
            </form>
          </div>

          <div className="admin-card">
            <h3>📋 Julkaistut tiedotteet</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Otsikko</th>
                    <th>Kiinnitetty</th>
                    <th>Päivämäärä</th>
                    <th>Toimenpiteet</th>
                  </tr>
                </thead>
                <tbody>
                  {allNews?.map((news) => (
                    <tr key={news.id}>
                      <td><strong>{news.title}</strong></td>
                      <td>{news.isPinned ? '📌 Kyllä' : '—'}</td>
                      <td>{new Date(news.createdAtUtc).toLocaleDateString('fi-FI')}</td>
                      <td>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="btn-touch text-xs"
                          onClick={() => deleteNewsMutation.mutate(news.id)}
                          disabled={deleteNewsMutation.isPending}
                        >
                          Poista
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. KÄYTTÄJIEN JA OIKEUKSIEN HALLINTA */}
      {activeSubTab === 'users' && (
        <div className="admin-subcontent">
          <div className="admin-card">
            <h3>👥 Järjestelmäkäyttäjät & Roolit</h3>
            <p className="admin-card-desc">
              Hallinnoi rekisteröityjä opiskelijoita ja ylläpitäjiä. Voit vaihtaa roolin Käyttäjän ja Adminin välillä.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nimi</th>
                    <th>Sähköposti</th>
                    <th>Rooli</th>
                    <th>Vaihda roolia</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers?.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.displayName}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <Badge
                          variant={u.role.toLowerCase().includes('admin') ? 'xamk' : 'secondary'}
                          className="text-xs"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td>
                        {u.role === 'SuperAdmin' ? (
                          <span className="text-muted">Pääkäyttäjä (pysyvä)</span>
                        ) : (
                          <select
                            className="input-touch select-small"
                            value={u.role}
                            onChange={(e) =>
                              updateUserRoleMutation.mutate({ userId: u.id, role: e.target.value })
                            }
                            disabled={updateUserRoleMutation.isPending}
                          >
                            <option value="User">User (Käyttäjä)</option>
                            <option value="Admin">Admin (Ylläpitäjä)</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SIVUSTOASETUKSET & DISCORD */}
      {activeSubTab === 'settings' && (
        <div className="admin-subcontent">
          <div className="admin-card">
            <h3>💬 Discord Webhook & Ilmoitusasetukset</h3>
            <p className="admin-card-desc">
              Kun Admin luo uuden tapahtuman tai turnauksen pelihuoneeseen, järjestelmä voi lähettää automaattisen ilmoituksen Discord-kanavallesi.
            </p>
            <form onSubmit={handleSaveSettings} className="form">
              <div className="form-group">
                <label htmlFor="webhook-url">Discord Webhook URL</label>
                <input
                  id="webhook-url"
                  type="url"
                  className="input-touch"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                />
                <span className="form-hint">
                  Luo webhook Discord-palvelimesi kanavan asetuksista (Integrations → Webhooks) ja liitä URL tähän.
                </span>
              </div>

              <div className="settings-summary-grid">
                <div className="settings-item">
                  <span className="settings-label">Aukioloajat:</span>
                  <span className="settings-val">{settings?.openingHoursText || '08:00 – 18:00 (Ma–Pe)'}</span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">Ennakkovarausraja:</span>
                  <span className="settings-val">Korkeintaan {settings?.maxAdvanceBookingMonths || 2} kuukautta</span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">Yksittäisvarauksen maksimi:</span>
                  <span className="settings-val">{settings?.maxIndividualHours || 4} tuntia / päivä</span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">Opiskelijan tilavaraus:</span>
                  <span className="settings-val">Enintään {settings?.maxStudentRoomHours || 4} tuntia</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="xamk"
                className="btn-touch font-bold"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? 'Tallennetaan...' : 'Tallenna asetukset'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 5. STATISTIIKKA & LOKITUS */}
      {activeSubTab === 'statistics' && (
        <div className="admin-subcontent">
          <div className="stats-metric-grid">
            <div className="metric-card">
              <span className="metric-icon">📅</span>
              <div className="metric-info">
                <span className="metric-val">{statistics?.totalReservations ?? 0}</span>
                <span className="metric-title">Kokonaisvaraukset</span>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon">🟢</span>
              <div className="metric-info">
                <span className="metric-val">{statistics?.activeReservations ?? 0}</span>
                <span className="metric-title">Aktiiviset varaukset</span>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon">👥</span>
              <div className="metric-info">
                <span className="metric-val">{statistics?.totalUsers ?? 0}</span>
                <span className="metric-title">Käyttäjämäärä</span>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon">🎮</span>
              <div className="metric-info">
                <span className="metric-val">{statistics?.totalGames ?? 0}</span>
                <span className="metric-title">Asennetut pelit</span>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3>📊 Pelipisteiden käyttöaste & Varausmäärät</h3>
            <div className="station-stats-list">
              {statistics?.stationUsage?.map((st) => (
                <div key={st.stationId} className="station-stat-row">
                  <div className="station-stat-meta">
                    <span className="st-name">
                      {st.stationType === 'PC' ? '🖥️' : '🎮'} {st.stationName}
                    </span>
                    <span className="st-numbers">
                      {st.reservationCount} varausta • {st.totalHours} tuntia
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, (st.reservationCount / Math.max(1, statistics.totalReservations)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h3>📑 Varausten jakautuminen tyypeittäin</h3>
            <div className="type-breakdown-grid">
              {statistics?.typeBreakdown?.map((tb) => (
                <div key={tb.reservationType} className="type-stat-card">
                  <span className="type-name">
                    {tb.reservationType === 'Individual'
                      ? '🎮 Yksittäisvaraukset'
                      : tb.reservationType === 'Room'
                      ? '🏢 Tilavaraukset'
                      : '🏆 Tapahtumat'}
                  </span>
                  <span className="type-count">{tb.count} kpl</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. VIKAILMOITUSTEN HALLINTA */}
      {activeSubTab === 'issues' && (
        <div className="admin-subcontent">
          <div className="admin-card">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <div>
                <h3>⚠️ Saapuneet vika- ja virheilmoitukset</h3>
                <p className="section-description">
                  Opiskelijoiden ja käyttäjien lähettämät ilmoitukset laitevioista, verkko-ongelmista ja tilan kunnosta.
                </p>
              </div>
              <span className="badge badge-accent">
                {allIssues?.filter((i) => !i.isResolved).length ?? 0} avointa ilmoitusta
              </span>
            </div>

            {(!allIssues || allIssues.length === 0) ? (
              <div className="empty-state">
                <p>Ei rekisteröityjä vikailmoituksia. Kaikki laitteet toimivat moitteettomasti!</p>
              </div>
            ) : (
              <div className="issues-list">
                {allIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`issue-card ${issue.isResolved ? 'issue-resolved' : 'issue-open'}`}
                  >
                    <div className="issue-card-header">
                      <div className="issue-meta">
                        <span className="target-tag">🖥️ {issue.target}</span>
                        <Badge variant={issue.isResolved ? 'success' : 'warning'} className="text-xs">
                          {issue.isResolved ? '🟢 Ratkaistu' : '🟡 Avoin'}
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
                          👤 {issue.reporterName || 'Opiskelija'} ({issue.reporterEmail})
                        </div>
                      )}
                    </div>

                    <h4 className="issue-title">{issue.title}</h4>
                    <p className="issue-desc">{issue.description}</p>

                    {issue.isResolved ? (
                      <div className="issue-resolution-info">
                        <strong>Ratkaistu:</strong> {issue.adminNotes || 'Kuitattu ilman lisähuomioita.'}
                        {issue.resolvedAt && (
                          <span className="resolution-date">
                            {' '}({new Date(issue.resolvedAt).toLocaleDateString('fi-FI', {
                              day: 'numeric',
                              month: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="issue-resolve-action">
                        <input
                          type="text"
                          className="input-touch"
                          placeholder="Kirjaa toimenpide (esim. hiiri vaihdettu)..."
                          id={`resolve-note-${issue.id}`}
                        />
                        <Button
                          type="button"
                          variant="xamk"
                          size="sm"
                          className="btn-touch"
                          onClick={() => {
                            const inputEl = document.getElementById(`resolve-note-${issue.id}`) as HTMLInputElement | null;
                            const notes = inputEl?.value.trim() || undefined;
                            resolveIssueMutation.mutate({ issueId: issue.id, notes });
                          }}
                          disabled={resolveIssueMutation.isPending}
                        >
                          ✓ Merkitse ratkaistuksi
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
