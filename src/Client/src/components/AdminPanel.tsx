import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Gamepad2,
  Newspaper,
  Users,
  Settings,
  BarChart3,
  AlertTriangle,
  Plus,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Monitor,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
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
      setErrorMessage(err instanceof ApiError ? err.message : 'Tilan vaihto epäonnistui.');
    },
  });

  // Luo tiedote
  const createNewsMutation = useMutation({
    mutationFn: (req: CreateNewsRequest) => api.createNews(req, user?.id ?? ''),
    onSuccess: (news) => {
      setStatusMessage(`Tiedote "${news.title}" julkaistu onnistuneesti!`);
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
    mutationFn: (id: string) => api.deleteNews(id, user?.id ?? ''),
    onSuccess: () => {
      setStatusMessage('Tiedote poistettu järjestelmästä.');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Tiedotteen poisto epäonnistui.');
    },
  });

  // Päivitä käyttäjärooli
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role),
    onSuccess: (updatedUser) => {
      setStatusMessage(`Käyttäjän ${updatedUser.displayName} rooliksi päivitetty: ${updatedUser.role}`);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Roolin päivitys epäonnistui.');
    },
  });

  // Tallenna sivustoasetukset
  const updateSettingsMutation = useMutation({
    mutationFn: (req: UpdateSiteSettingsRequest) => api.updateSettings(req),
    onSuccess: () => {
      setStatusMessage('Sivuston asetukset tallennettu onnistuneesti!');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Asetusten tallennus epäonnistui.');
    },
  });

  // Kuittaa vikailmoitus
  const resolveIssueMutation = useMutation({
    mutationFn: ({ issueId, notes }: { issueId: string; notes?: string }) =>
      api.resolveIssueReport(issueId, { adminNotes: notes }, user?.id ?? ''),
    onSuccess: (updated) => {
      setStatusMessage(`Vikailmoitus "${updated.title}" merkitty ratkaistuksi.`);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof ApiError ? err.message : 'Vikailmoituksen kuittaus epäonnistui.');
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center shadow-xl">
        Vain ylläpitäjillä (Admin) on pääsy tähän paneeliin.
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
      discordWebhookUrl: discordWebhookUrl.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-full flex flex-col gap-6">
      {/* Yläkortti: Otsikko */}
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col items-start">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#fbba18]" />
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white font-sans">
            Ylläpitäjän hallintapaneeli
          </h2>
        </div>
        <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Hallinnoi pelivalikoimaa, julkaise tiedotteita, muokkaa käyttöoikeuksia, konfiguroi Discord-ilmoituksia ja seuraa varaustilastoja.
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

      {/* Alavalikko / Välilehdet (Dock-tyyli) */}
      <div className="flex items-center gap-1.5 p-1 bg-[#111318] border border-[#262a36] rounded-xl flex-wrap">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'games'
              ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveSubTab('games')}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Pelit ({allGames?.length ?? 0})</span>
        </button>

        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'news'
              ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveSubTab('news')}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Tiedotteet ({allNews?.length ?? 0})</span>
        </button>

        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'users'
              ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveSubTab('users')}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Käyttäjät</span>
        </button>

        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'settings'
              ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveSubTab('settings')}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Asetukset</span>
        </button>

        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'statistics'
              ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveSubTab('statistics')}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Statistiikka</span>
        </button>

        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'issues'
              ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveSubTab('issues')}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Vikailmoitukset</span>
          {(allIssues?.filter((i) => !i.isResolved).length ?? 0) > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
              {allIssues?.filter((i) => !i.isResolved).length}
            </span>
          )}
        </button>
      </div>

      {/* 1. PELIEN HALLINTA */}
      {activeSubTab === 'games' && (
        <div className="flex flex-col gap-6">
          {/* Lisää uusi peli */}
          <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#fbba18]" />
              <span>Lisää uusi peli valikoimaan</span>
            </h3>
            <form onSubmit={handleAddGame} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pelin nimi *</label>
                  <input
                    type="text"
                    className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                    placeholder="esim. Helldivers 2"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Alusta</label>
                  <select
                    className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors cursor-pointer"
                    value={newGamePlatform}
                    onChange={(e) => setNewGamePlatform(e.target.value)}
                  >
                    <option value="PC">PC</option>
                    <option value="PlayStation5">PlayStation 5</option>
                    <option value="NintendoSwitch">Nintendo Switch</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kuvaus</label>
                <textarea
                  className="w-full bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl p-3 text-xs outline-none transition-colors resize-none"
                  rows={2}
                  placeholder="Lyhyt kuvaus pelistä..."
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  disabled={addGameMutation.isPending}
                >
                  {addGameMutation.isPending ? 'Tallennetaan...' : 'Lisää peli valikoimaan'}
                </button>
              </div>
            </form>
          </div>

          {/* Kaikki pelit ja toivelista */}
          <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-[#fbba18]" />
              <span>Kaikki pelit ja toivelistan hyväksyminen</span>
            </h3>
            <div className="overflow-x-auto border border-[#2d323f] rounded-xl bg-[#111318]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0d11] border-b border-[#2d323f] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Nimi</th>
                    <th className="px-4 py-3">Alusta</th>
                    <th className="px-4 py-3">Äänet</th>
                    <th className="px-4 py-3">Tila</th>
                    <th className="px-4 py-3">Toimenpiteet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1f28]">
                  {allGames?.map((game) => (
                    <tr key={game.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{game.name}</td>
                      <td className="px-4 py-3 text-gray-300">{game.platform}</td>
                      <td className="px-4 py-3">
                        {game.isWishlist ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            {game.votesCount || 0} ääntä
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          game.isWishlist
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        }`}>
                          {game.isWishlist ? 'Toivelistalla' : 'Asennettu'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-[#1c202a] hover:bg-[#282e3c] border border-[#2d323f] text-xs font-semibold text-gray-200 hover:text-white transition-colors cursor-pointer"
                          onClick={() => toggleWishlistMutation.mutate(game.id)}
                          disabled={toggleWishlistMutation.isPending}
                        >
                          {game.isWishlist ? 'Hyväksy valikoimaan' : 'Siirrä toivelistalle'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. UUTISTEN HALLINTA */}
      {activeSubTab === 'news' && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-[#fbba18]" />
              <span>Julkaise uusi tiedote</span>
            </h3>
            <form onSubmit={handleCreateNews} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tiedotteen otsikko *</label>
                <input
                  type="text"
                  className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                  placeholder="esim. Perjantain turnaus alkaa klo 14!"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-[#111318] border border-[#2d323f] text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
                  onClick={() => setNewsContent((c) => c + ' **lihavoitu teksti**')}
                >
                  <strong>B</strong> Lihavoi
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-[#111318] border border-[#2d323f] text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
                  onClick={() => setNewsContent((c) => c + '\n- Lista-asia 1\n- Lista-asia 2')}
                >
                  • Lista
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-[#111318] border border-[#2d323f] text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
                  onClick={() => setNewsContent((c) => c + ' [Linkkiteksti](https://...)')}
                >
                  Linkki
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    previewNews ? 'bg-[#fbba18]/20 border border-[#fbba18]/40 text-[#fbba18]' : 'bg-[#111318] border border-[#2d323f] text-gray-300'
                  }`}
                  onClick={() => setPreviewNews(!previewNews)}
                >
                  {previewNews ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{previewNews ? 'Piilota esikatselu' : 'Esikatsele'}</span>
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sisältö *</label>
                <textarea
                  className="w-full bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl p-3 text-xs outline-none transition-colors resize-none leading-relaxed"
                  rows={4}
                  placeholder="Kirjoita tiedotteen teksti..."
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  required
                />
              </div>

              {previewNews && (
                <div className="p-4 rounded-xl bg-[#111318] border border-[#fbba18]/30 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-[#fbba18] uppercase tracking-wider">Esikatselu:</span>
                  <h4 className="text-sm font-bold text-white">{newsTitle || 'Tiedotteen otsikko'}</h4>
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">{newsContent || 'Sisältöteksti...'}</p>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  className="rounded border-[#2d323f] text-[#fbba18] focus:ring-[#fbba18]"
                  checked={newsIsPinned}
                  onChange={(e) => setNewsIsPinned(e.target.checked)}
                />
                <span>Kiinnitä tiedote sivuston huomiopalkkiin</span>
              </label>

              <div className="pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  disabled={createNewsMutation.isPending}
                >
                  {createNewsMutation.isPending ? 'Julkaistaan...' : 'Julkaise tiedote'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-[#fbba18]" />
              <span>Julkaistut tiedotteet</span>
            </h3>
            <div className="overflow-x-auto border border-[#2d323f] rounded-xl bg-[#111318]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0d11] border-b border-[#2d323f] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Otsikko</th>
                    <th className="px-4 py-3">Kiinnitetty</th>
                    <th className="px-4 py-3">Päivämäärä</th>
                    <th className="px-4 py-3">Toimenpiteet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1f28]">
                  {allNews?.map((news) => (
                    <tr key={news.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{news.title}</td>
                      <td className="px-4 py-3">
                        {news.isPinned ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fbba18] text-[#0a0b0d]">
                            Kyllä
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-mono">
                        {new Date(news.createdAtUtc).toLocaleDateString('fi-FI')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                          onClick={() => deleteNewsMutation.mutate(news.id)}
                          disabled={deleteNewsMutation.isPending}
                        >
                          Poista
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. KÄYTTÄJIEN HALLINTA */}
      {activeSubTab === 'users' && (
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#fbba18]" />
            <span>Järjestelmäkäyttäjät & Roolit</span>
          </h3>
          <p className="text-xs text-gray-400">
            Hallinnoi rekisteröityjä opiskelijoita ja ylläpitäjiä. Voit vaihtaa roolin Käyttäjän ja Adminin välillä.
          </p>
          <div className="overflow-x-auto border border-[#2d323f] rounded-xl bg-[#111318]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0d11] border-b border-[#2d323f] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nimi</th>
                  <th className="px-4 py-3">Sähköposti</th>
                  <th className="px-4 py-3">Rooli</th>
                  <th className="px-4 py-3">Vaihda roolia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1f28]">
                {allUsers?.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{u.displayName}</td>
                    <td className="px-4 py-3 text-gray-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role.toLowerCase().includes('admin')
                          ? 'bg-[#fbba18]/15 border border-[#fbba18]/30 text-[#fbba18]'
                          : 'bg-white/5 border border-white/10 text-gray-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'SuperAdmin' ? (
                        <span className="text-gray-500 text-xs">Pääkäyttäjä (pysyvä)</span>
                      ) : (
                        <select
                          className="h-8 bg-[#181a22] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-lg px-2 text-xs outline-none cursor-pointer"
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
      )}

      {/* 4. ASETUKSET & DISCORD */}
      {activeSubTab === 'settings' && (
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4 max-w-2xl">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#fbba18]" />
            <span>Discord Webhook & Ilmoitusasetukset</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Kun Admin luo uuden tapahtuman tai turnauksen pelihuoneeseen, järjestelmä voi lähettää automaattisen ilmoituksen Discord-kanavallesi.
          </p>
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Discord Webhook URL</label>
              <input
                type="url"
                className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              />
              <span className="text-[10px] text-gray-400">
                Luo webhook Discord-kanavan asetuksista (Integrations → Webhooks) ja liitä osoite tähän.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-[#111318] border border-[#262a36]">
              <div>
                <span className="text-gray-400">Aukioloajat:</span>
                <strong className="block text-white">{settings?.openingHoursText || '08:00 – 18:00 (Ma–Pe)'}</strong>
              </div>
              <div>
                <span className="text-gray-400">Ennakkovarausraja:</span>
                <strong className="block text-white">Max {settings?.maxAdvanceBookingMonths || 2} kuukautta</strong>
              </div>
              <div>
                <span className="text-gray-400">Yksittäisvaraus:</span>
                <strong className="block text-white">Max {settings?.maxIndividualHours || 4}h / päivä</strong>
              </div>
              <div>
                <span className="text-gray-400">Tilavaraus:</span>
                <strong className="block text-white">Max {settings?.maxStudentRoomHours || 4}h</strong>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? 'Tallennetaan...' : 'Tallenna asetukset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. STATISTIIKKA */}
      {activeSubTab === 'statistics' && (
        <div className="flex flex-col gap-6">
          {/* Metriikkalaatikot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#fbba18]/15 text-[#fbba18]">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white">{statistics?.totalReservations ?? 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kaikki varaukset</span>
              </div>
            </div>

            <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white">{statistics?.activeReservations ?? 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aktiiviset varaukset</span>
              </div>
            </div>

            <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white">{statistics?.totalUsers ?? 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Käyttäjämäärä</span>
              </div>
            </div>

            <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white">{statistics?.totalGames ?? 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Asennetut pelit</span>
              </div>
            </div>
          </div>

          {/* Laitteiden käyttöaste */}
          <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#fbba18]" />
              <span>Pelipisteiden käyttöaste & Varausmäärät</span>
            </h3>
            <div className="flex flex-col gap-3">
              {statistics?.stationUsage?.map((st) => (
                <div key={st.stationId} className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#111318] border border-[#262a36]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {st.stationType === 'PC' ? <Monitor className="w-3.5 h-3.5 text-cyan-400" /> : <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />}
                      <span>{st.stationName}</span>
                    </span>
                    <span className="text-gray-400 text-[11px] font-mono">
                      {st.reservationCount} varausta • {st.totalHours} tuntia
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1c202a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#d89619] to-[#fbba18] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (st.reservationCount / Math.max(1, statistics.totalReservations)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. VIKAILMOITUKSET */}
      {activeSubTab === 'issues' && (
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#2d323f]">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#fbba18]" />
              <span>Saapuneet vika- ja virheilmoitukset</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300">
              {allIssues?.filter((i) => !i.isResolved).length ?? 0} avointa ilmoitusta
            </span>
          </div>

          {(!allIssues || allIssues.length === 0) ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Ei rekisteröityjä vikailmoituksia. Kaikki laitteet toimivat moitteettomasti!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-all ${
                    issue.isResolved ? 'bg-[#111318] border-[#222632] opacity-70' : 'bg-[#151720] border-[#d89619]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white">
                        {issue.target}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        issue.isResolved
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {issue.isResolved ? 'Ratkaistu' : 'Avoin'}
                      </span>
                      <time className="text-[10px] text-gray-400 font-mono">
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
                      <span className="text-[11px] text-gray-400">
                        {issue.reporterName || 'Opiskelija'} ({issue.reporterEmail})
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white">{issue.title}</h4>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{issue.description}</p>

                  {issue.isResolved ? (
                    <div className="text-[11px] text-gray-400 bg-white/5 p-2 rounded-lg">
                      <strong>Ratkaistu:</strong> {issue.adminNotes || 'Kuitattu ilman lisähuomioita.'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-2 border-t border-[#252936]">
                      <input
                        type="text"
                        placeholder="Kirjaa toimenpide (esim. hiiri vaihdettu)..."
                        className="flex-1 h-9 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-lg px-3 text-xs outline-none"
                        id={`resolve-note-${issue.id}`}
                      />
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        onClick={() => {
                          const inputEl = document.getElementById(`resolve-note-${issue.id}`) as HTMLInputElement | null;
                          const notes = inputEl?.value.trim() || undefined;
                          resolveIssueMutation.mutate({ issueId: issue.id, notes });
                        }}
                        disabled={resolveIssueMutation.isPending}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Merkitse ratkaistuksi</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
