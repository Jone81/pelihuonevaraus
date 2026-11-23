/**
 * @file AdminGamesView.tsx
 * @description Ylläpitopaneelin pelivalikoiman ja opiskelijoiden toivelistan hallintanäkymä.
 * Täysleveä pelitaulukko hakutoiminnolla ja suodatintabeilla sekä Radix Dialog -modaali
 * uuden pelin lisäämiseen.
 */
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Gamepad2, CheckCircle2, Plus } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { CreateGameRequest } from '../../types';

/**
 * AdminGamesView-komponentin ominaisuudet.
 */
export interface AdminGamesViewProps {
  /** Callback onnistumisviestin näyttämiseen */
  onStatus: (msg: string | null) => void;
  /** Callback virheviestin näyttämiseen */
  onError: (msg: string | null) => void;
}

/**
 * Pelien ja toivelistan hallintanäkymä ylläpitopaneelissa.
 */
export const AdminGamesView: React.FC<AdminGamesViewProps> = ({
  onStatus,
  onError,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
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
              type="button"
              variant="pill"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Add game' : 'Lisää peli'}</span>
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
              <TableHead>{isEn ? 'Action' : 'Toimenpide'}</TableHead>
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
                  <button
                    type="button"
                    className={
                      game.isWishlist
                        ? 'inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[3px_3px_0px_#000000] font-mono text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-transform duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] disabled:opacity-50'
                        : 'inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-[#3F444E] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:border-[#FACC15] hover:bg-[#252930] disabled:opacity-50'
                    }
                    onClick={() => toggleWishlistMutation.mutate(game.id)}
                    disabled={toggleWishlistMutation.isPending}
                  >
                    {game.isWishlist ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                        <span>{isEn ? 'Approve to catalog' : 'Hyväksy valikoimaan'}</span>
                      </>
                    ) : isEn ? (
                      'Move to wishlist'
                    ) : (
                      'Siirrä toivelistalle'
                    )}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Lisää peli -modaali */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEn ? 'Add new game to catalog' : 'Lisää uusi peli suoraan valikoimaan'}
            </DialogTitle>
            <div className="w-12 h-1 bg-[#FACC15]" />
            <DialogDescription>
              {isEn
                ? 'Games added here are immediately marked as installed in the Xamk Game Room catalog.'
                : 'Tästä lisätyt pelit merkitään suoraan asennetuiksi Xamk Game Roomin pelivalikoimaan.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddGame} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-game-name">
                {isEn ? 'Game title *' : 'Pelin nimi *'}
              </Label>
              <Input
                id="modal-game-name"
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
              <Label htmlFor="modal-game-platform">
                {isEn ? 'Hardware platform *' : 'Alusta *'}
              </Label>
              <NativeSelect
                id="modal-game-platform"
                value={newGamePlatform}
                onChange={(e) => setNewGamePlatform(e.target.value)}
              >
                <option value="PC">PC</option>
                <option value="PlayStation5">PlayStation 5</option>
                <option value="NintendoSwitch">Nintendo Switch</option>
              </NativeSelect>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-game-desc">
                {isEn ? 'Short description' : 'Lyhyt kuvaus'}
              </Label>
              <Textarea
                id="modal-game-desc"
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

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
                disabled={addGameMutation.isPending}
              >
                {isEn ? 'Cancel' : 'Peruuta'}
              </Button>
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
                    ? 'Add game to catalog'
                    : 'Lisää peli valikoimaan'}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
