/**
 * @file AdminGamesView.tsx
 * @description Ylläpitopaneelin pelivalikoiman ja opiskelijoiden toivelistan hallintanäkymä.
 * Täysleveä pelitaulukko hakutoiminnolla ja suodatintabeilla sekä Radix Dialog -modaali
 * uuden pelin lisäämiseen.
 */
import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Gamepad2, CheckCircle2, Plus, ChevronLeft, ChevronDown, ArrowRightLeft } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { CreateGameRequest, Game } from '../../types';

/**
 * AdminGamesView-komponentin ominaisuudet.
 */
export interface AdminGamesViewProps {
  /** Näkymän tila (`list` tai `new`) */
  mode?: 'list' | 'new';
  /** Callback onnistumisviestin näyttämiseen */
  onStatus: (msg: string | null) => void;
  /** Callback virheviestin näyttämiseen */
  onError: (msg: string | null) => void;
}

/**
 * Pelien ja toivelistan hallintanäkymä ylläpitopaneelissa.
 */
export const AdminGamesView: React.FC<AdminGamesViewProps> = ({
  mode,
  onStatus,
  onError,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const isNewGameRoute = mode === 'new' || location.pathname.replace(/\/+$/, '') === '/admin/games/new';
  const [selectedActionGame, setSelectedActionGame] = useState<Game | null>(null);
  const [newGameName, setNewGameName] = useState('');
  const [newGamePlatform, setNewGamePlatform] = useState('PC');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [gameFilter, setGameFilter] = useState<'ALL' | 'INSTALLED' | 'WISHLIST'>('ALL');
  const [gameSearch, setGameSearch] = useState('');

  const { data: allGames } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.getGames(),
    enabled: isAdmin,
  });

  // Lisää peli suoraan asennettuun pelivalikoimaan
  const addGameMutation = useMutation({
    mutationFn: (req: CreateGameRequest) => api.createGame(req, user?.id ?? ''),
    onSuccess: (game) => {
      onStatus(
        isEn
          ? `Game "${game.name}" added to the catalog.`
          : `Peli "${game.name}" lisätty valikoimaan.`
      );
      onError(null);
      setNewGameName('');
      setNewGameDesc('');
      setNewGamePlatform('PC');
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      navigate('/admin/games');
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
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
      onStatus(
        isEn
          ? `Updated "${game.name}" status to ${game.isWishlist ? 'wishlist' : 'installed'}.`
          : `Pelin "${game.name}" tila päivitetty: ${
              game.isWishlist ? 'toivelistalla' : 'asennettuna valikoimassa'
            }.`
      );
      onError(null);
      setSelectedActionGame(null);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update game status.'
          : 'Pelin tilan päivitys epäonnistui.'
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

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;
    addGameMutation.mutate({
      name: newGameName.trim(),
      platform: newGamePlatform,
      description: newGameDesc.trim(),
    });
  };

  if (isNewGameRoute) {
    return (
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle>
              {isEn ? 'Add new game to catalog' : 'Lisää uusi peli suoraan valikoimaan'}
            </CardTitle>
            <div className="w-12 h-1 bg-[#FACC15] mt-1.5 mb-2" />
            <CardDescription>
              {isEn
                ? 'Games added here are immediately marked as installed in the Xamk Game Room catalog.'
                : 'Tästä lisätyt pelit merkitään suoraan asennetuiksi Xamk Game Roomin pelivalikoimaan.'}
            </CardDescription>
          </div>

          <Button
            asChild
            variant="outline"
            className="shrink-0 no-underline"
          >
            <Link to="/admin/games">
              <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Back to game list' : 'Takaisin pelilistaukseen'}</span>
            </Link>
          </Button>
        </div>

        <form onSubmit={handleAddGame} className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-game-name">
                {isEn ? 'Game title *' : 'Pelin nimi *'}
              </Label>
              <Input
                id="new-game-name"
                type="text"
                placeholder={
                  isEn
                    ? 'For example Helldivers 2 or Counter-Strike 2'
                    : 'Esimerkiksi Helldivers 2 tai Counter-Strike 2'
                }
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-game-platform">
                {isEn ? 'Hardware platform *' : 'Alusta *'}
              </Label>
              <NativeSelect
                id="new-game-platform"
                value={newGamePlatform}
                onChange={(e) => setNewGamePlatform(e.target.value)}
              >
                <option value="PC">PC</option>
                <option value="PlayStation5">PlayStation 5</option>
                <option value="NintendoSwitch">Nintendo Switch</option>
              </NativeSelect>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-game-desc">
              {isEn ? 'Short description' : 'Lyhyt kuvaus'}
            </Label>
            <Textarea
              id="new-game-desc"
              rows={3}
              placeholder={
                isEn
                  ? 'Genre, multiplayer info, or notes...'
                  : 'Lyhyt kuvaus pelistä tai pelimuodoista...'
              }
              value={newGameDesc}
              onChange={(e) => setNewGameDesc(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              variant="secondary"
              className="no-underline"
            >
              <Link to="/admin/games">
                {isEn ? 'Cancel' : 'Peruuta'}
              </Link>
            </Button>
            <Button
              type="submit"
              variant="pill"
              disabled={addGameMutation.isPending}
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>
                {addGameMutation.isPending
                  ? isEn
                    ? 'Saving...'
                    : 'Tallennetaan...'
                  : isEn
                  ? 'Add game to catalog'
                  : 'Lisää peli valikoimaan'}
              </span>
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <CardTitle>
              {isEn ? 'Catalog and wishlist approval' : 'Kaikki pelit ja toivelistan hyväksyminen'}
            </CardTitle>
            <div className="w-12 h-1 bg-[#FACC15] mt-1.5 mb-2" />
            <CardDescription>
              {isEn
                ? 'Browse installed games, approve student wishes into the catalog, or add new titles.'
                : 'Selaa asennettuja pelejä, hyväksy opiskelijoiden toiveita valikoimaan tai lisää uusia pelejä.'}
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              asChild
              variant="pill"
              className="no-underline"
            >
              <Link to="/admin/games/new">
                <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                <span>{isEn ? 'Add new game' : 'Lisää uusi peli'}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Haku- ja suodatinrivi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder={
                isEn ? 'Search by game title or platform...' : 'Hae pelin nimellä tai alustalla...'
              }
              value={gameSearch}
              onChange={(e) => setGameSearch(e.target.value)}
            />
          </div>

          <Tabs
            value={gameFilter}
            onValueChange={(v) => setGameFilter(v as 'ALL' | 'INSTALLED' | 'WISHLIST')}
          >
            <TabsList className="w-full sm:w-auto">
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isEn ? 'Game' : 'Peli'}</TableHead>
              <TableHead>{isEn ? 'Platform' : 'Alusta'}</TableHead>
              <TableHead>{isEn ? 'Votes' : 'Äänet'}</TableHead>
              <TableHead>{isEn ? 'Status' : 'Tila'}</TableHead>
              <TableHead>{isEn ? 'Actions' : 'Toiminnot'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGames.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <strong className="font-bold text-[#F4F4F5]">{game.name}</strong>
                    {game.description && (
                      <span className="text-xs text-[#9CA3AF] leading-snug">{game.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-none bg-[#121417] border border-[#3F444E] font-mono text-xs font-bold text-[#F4F4F5]">
                    {game.platform === 'PC' ? (
                      <>
                        <Monitor className="w-3.5 h-3.5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                        <span>PC</span>
                      </>
                    ) : game.platform === 'PlayStation5' ? (
                      <>
                        <Gamepad2 className="w-3.5 h-3.5 shrink-0 text-[#3B82F6]" strokeWidth={2.5} aria-hidden="true" />
                        <span>PS5</span>
                      </>
                    ) : (
                      <>
                        <Gamepad2 className="w-3.5 h-3.5 shrink-0 text-[#EF4444]" strokeWidth={2.5} aria-hidden="true" />
                        <span>Switch</span>
                      </>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  {game.isWishlist ? (
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black font-mono text-xs font-extrabold">
                      {game.votesCount || 0}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-[#9CA3AF]">-</span>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-[#3F444E] hover:border-[#FACC15] shadow-[2px_2px_0px_#000000] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <span>{isEn ? 'Actions' : 'Toiminnot'}</span>
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-black shadow-[6px_6px_0px_#FACC15] min-w-[220px] p-1">
                      <DropdownMenuLabel>
                        {isEn ? 'Game actions' : 'Pelin toiminnot'}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedActionGame(game)}>
                        {game.isWishlist ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" strokeWidth={2.5} aria-hidden="true" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                        )}
                        <span>
                          {game.isWishlist
                            ? isEn
                              ? 'Approve to catalog...'
                              : 'Hyväksy valikoimaan...'
                            : isEn
                            ? 'Move to wishlist...'
                            : 'Siirrä toivelistalle...'}
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Hallinnoi peliä -modaali */}
      <Dialog
        open={selectedActionGame !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedActionGame(null);
        }}
      >
        <DialogContent>
          {selectedActionGame && (
            <>
              <DialogHeader>
                <DialogTitle className="break-words">
                  {isEn
                    ? `Manage game: ${selectedActionGame.name}`
                    : `Hallinnoi peliä: ${selectedActionGame.name}`}
                </DialogTitle>
                <div className="w-12 h-1 bg-[#FACC15]" />
                <DialogDescription>
                  {selectedActionGame.isWishlist
                    ? isEn
                      ? 'Approve this student wishlist title as installed in the catalog.'
                      : 'Hyväksy opiskelijatoive asennetuksi pelivalikoimaan.'
                    : isEn
                    ? 'Move this installed catalog game back to the student wishlist.'
                    : 'Siirrä asennettu peli takaisin opiskelijoiden toivelistalle.'}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <strong className="font-bold text-[#F4F4F5]">{selectedActionGame.name}</strong>
                  <div className="flex items-center gap-2">
                    <Badge variant="status">{selectedActionGame.platform}</Badge>
                    {selectedActionGame.isWishlist && (
                      <Badge variant="wishlist">
                        {selectedActionGame.votesCount ?? 0} {isEn ? 'votes' : 'ääntä'}
                      </Badge>
                    )}
                  </div>
                </div>
                {selectedActionGame.description && (
                  <p className="text-xs text-[#9CA3AF] m-0">{selectedActionGame.description}</p>
                )}
              </div>

              <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-3.5 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold uppercase text-[#9CA3AF]">
                  {isEn ? 'Action *' : 'Toimenpide *'}
                </span>
                <span className="font-mono text-xs font-extrabold text-[#FACC15]">
                  {selectedActionGame.isWishlist
                    ? isEn
                      ? 'Approve as installed'
                      : 'Hyväksy asennetuksi valikoimaan'
                    : isEn
                    ? 'Move to wishlist'
                    : 'Siirrä toivelistalle'}
                </span>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedActionGame(null)}
                  disabled={toggleWishlistMutation.isPending}
                >
                  {isEn ? 'Cancel' : 'Peruuta'}
                </Button>
                <Button
                  type="button"
                  variant="pill"
                  disabled={toggleWishlistMutation.isPending}
                  onClick={() => toggleWishlistMutation.mutate(selectedActionGame.id)}
                >
                  {isEn ? 'Confirm action' : 'Vahvista toimenpide'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
