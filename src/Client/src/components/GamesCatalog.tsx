/**
 * @file GamesCatalog.tsx
 * @description Pelivalikoima- ja opiskelijoiden toivelistanäkymä.
 * Mahdollistaa asennettujen pelien suodattamisen alustan mukaan (PC, PS5, Switch),
 * toivelistan selaamisen ja äänestämisen sekä uusien pelitoiveiden ehdottamisen modaalissa.
 */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gamepad2, Monitor, Star, ThumbsUp, Plus } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import type { WishGameRequest } from '../types';

/**
 * Pelivalikoima ja toivelista -komponentti.
 */
export const GamesCatalog: React.FC = () => {
  const queryClient = useQueryClient();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  // Suodatinvälilehden ja peliehdotusmodaalin tilat
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PC' | 'PlayStation5' | 'NintendoSwitch' | 'WISHLIST'>('ALL');
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [wishName, setWishName] = useState('');
  const [wishPlatform, setWishPlatform] = useState('PC');
  const [wishDesc, setWishDesc] = useState('');
  const [wishSuccess, setWishSuccess] = useState<string | null>(null);
  const [wishError, setWishError] = useState<string | null>(null);

  // Pidetään kirjaa istunnon aikana äänestetyistä peleistä tuplaäänten estämiseksi
  const [votedGameIds, setVotedGameIds] = useState<Set<string>>(() => new Set());

  // Haetaan kaikki pelit (sekä asennetut että toivelistan pelit)
  const { data: allGames, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.getGames(),
  });

  // Mutaatio uuden pelitoiveen lähettämiseen
  const wishMutation = useMutation({
    mutationFn: (req: WishGameRequest) => api.addWishlistGame(req),
    onSuccess: (createdGame) => {
      setWishSuccess(
        isEn
          ? `Wish added: "${createdGame.name}". Administrators will review the suggestion.`
          : `Toive lisätty: "${createdGame.name}". Ylläpito käy toiveet läpi.`
      );
      setWishError(null);
      setWishName('');
      setWishDesc('');
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setTimeout(() => {
        setIsWishModalOpen(false);
        setWishSuccess(null);
      }, 1800);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setWishError(err.message);
      } else {
        setWishError(isEn ? 'Failed to submit game wish.' : 'Toiveen lähetys epäonnistui.');
      }
    },
  });

  // Mutaatio toivelistan pelin äänestämiseen
  const voteMutation = useMutation({
    mutationFn: (gameId: string) => api.voteGame(gameId),
    onSuccess: (updatedGame) => {
      setVotedGameIds((prev) => new Set(prev).add(updatedGame.id));
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

  /**
   * Käsittelee uuden pelitoivelomakkeen lähetyksen.
   */
  const handleWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim()) {
      setWishError(isEn ? 'Game title is required.' : 'Pelin nimi on pakollinen.');
      return;
    }

    wishMutation.mutate({
      name: wishName.trim(),
      platform: wishPlatform,
      description: wishDesc.trim(),
    });
  };

  /**
   * Antaa äänen valitulle toivelistapelille, jos käyttäjä ei ole vielä äänestänyt sitä.
   */
  const handleVote = (gameId: string) => {
    if (votedGameIds.has(gameId)) return;
    voteMutation.mutate(gameId);
  };

  // Suodatetaan ja järjestetään pelit valitun välilehden mukaan (toivelista äänimäärän mukaan, muut aakkosjärjestyksessä)
  const filteredGames = (allGames ?? [])
    .filter((game) => {
      if (selectedFilter === 'ALL') return !game.isWishlist;
      if (selectedFilter === 'WISHLIST') return game.isWishlist;
      return game.platform === selectedFilter && !game.isWishlist;
    })
    .sort((a, b) => {
      if (selectedFilter === 'WISHLIST') {
        return (b.votesCount || 0) - (a.votesCount || 0);
      }
      return a.name.localeCompare(b.name);
    });

  const wishlistCount = allGames?.filter((g) => g.isWishlist).length || 0;

  return (
    <div className="games-catalog-container">
      <div className="section-header flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2>{t('games.title')}</h2>
          <p className="section-description">{t('games.subtitle')}</p>
        </div>
        <Button
          type="button"
          variant="pill"
          onClick={() => setIsWishModalOpen(true)}
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t('wishlist.propose')}</span>
        </Button>
      </div>

      {/* Suodatusnapit (shadcn/ui Tabs) */}
      <Tabs
        value={selectedFilter}
        onValueChange={(v) =>
          setSelectedFilter(v as 'ALL' | 'PC' | 'PlayStation5' | 'NintendoSwitch' | 'WISHLIST')
        }
        className="my-4"
      >
        <TabsList aria-label="Pelialustat">
          <TabsTrigger value="ALL">{t('games.filterAll')}</TabsTrigger>
          <TabsTrigger value="PC" className="inline-flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>PC</span>
          </TabsTrigger>
          <TabsTrigger value="PlayStation5" className="inline-flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>PlayStation 5</span>
          </TabsTrigger>
          <TabsTrigger value="NintendoSwitch" className="inline-flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Nintendo Switch</span>
          </TabsTrigger>
          <TabsTrigger value="WISHLIST" className="inline-flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t('wishlist.tabWishlist')}</span>
            {wishlistCount > 0 && (
              <Badge variant="wishlist" className="ml-1">
                {wishlistCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {selectedFilter === 'WISHLIST' && (
        <Card className="my-4 flex-row items-center justify-between flex-wrap gap-4">
          <div className="wishlist-intro-text">
            <CardTitle>{t('wishlist.introTitle')}</CardTitle>
            <CardDescription>{t('wishlist.introDesc')}</CardDescription>
          </div>
          <Button
            type="button"
            variant="pill"
            onClick={() => setIsWishModalOpen(true)}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t('wishlist.proposeNew')}</span>
          </Button>
        </Card>
      )}

      {/* Peliruudukko */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>{t('games.loading')}</span>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="empty-state">
          <p>
            {selectedFilter === 'WISHLIST'
              ? t('games.emptyWishlist')
              : t('games.emptyCategory')}
          </p>
        </div>
      ) : (
        <div className="games-grid">
          {filteredGames.map((game) => (
            <Card key={game.id} className={`game-card ${game.isWishlist ? 'game-card-wish' : ''}`}>
              <CardHeader className="p-0">
                <div className="game-card-header flex items-center justify-between">
                  <span className="xamk-platform-chip inline-flex items-center gap-1.5">
                    {game.platform === 'PC' ? (
                      <>
                        <Monitor className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>PC</span>
                      </>
                    ) : game.platform === 'PlayStation5' ? (
                      <>
                        <Gamepad2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>PS5</span>
                      </>
                    ) : (
                      <>
                        <Gamepad2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Switch</span>
                      </>
                    )}
                  </span>
                  {game.isWishlist ? (
                    <Badge variant="wishlist">
                      {game.votesCount || 0} {t('wishlist.votes')}
                    </Badge>
                  ) : (
                    <Badge variant="installed">{t('games.installed')}</Badge>
                  )}
                </div>
                <CardTitle className="mt-2">{game.name}</CardTitle>
                {game.description && (
                  <CardDescription>{game.description}</CardDescription>
                )}
              </CardHeader>

              {game.isWishlist && (
                <CardFooter className="p-0 pt-3 border-t border-[#2b2d34]">
                  <span className="text-xs text-[#9da3ae]">
                    {t('wishlist.communityWish')}
                  </span>
                  <Button
                    type="button"
                    variant={votedGameIds.has(game.id) ? 'secondary' : 'pill'}
                    size="sm"
                    onClick={() => handleVote(game.id)}
                    disabled={votedGameIds.has(game.id) || voteMutation.isPending}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{votedGameIds.has(game.id) ? t('wishlist.voted') : t('wishlist.vote')}</span>
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Peli-ehdotusmodaali */}
      <Dialog open={isWishModalOpen} onOpenChange={(open) => !open && setIsWishModalOpen(false)}>
        <DialogContent className="xamk-modal-md">
          <DialogHeader>
            <div className="xamk-modal-header-row">
              <div className="xamk-modal-icon-badge" aria-hidden="true">
                <Star className="w-5 h-5 shrink-0" aria-hidden="true" />
              </div>
              <div className="xamk-modal-title-group">
                <DialogTitle>{t('wishlist.modalTitle')}</DialogTitle>
                <div className="xamk-modal-underline" />
                <DialogDescription>{t('wishlist.modalDesc')}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {wishSuccess && <div className="alert alert-success">{wishSuccess}</div>}
          {wishError && <div className="alert alert-error">{wishError}</div>}

          <form onSubmit={handleWishSubmit} className="xamk-modal-form">
            <div className="xamk-field-group">
              <Label htmlFor="wish-name">{t('wishlist.gameName')} *</Label>
              <Input
                id="wish-name"
                type="text"
                placeholder={t('wishlist.gameNamePlaceholder')}
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                required
              />
            </div>

            <div className="xamk-field-group">
              <Label htmlFor="wish-platform">{t('wishlist.platform')} *</Label>
              <NativeSelect
                id="wish-platform"
                value={wishPlatform}
                onChange={(e) => setWishPlatform(e.target.value)}
              >
                <option value="PC">PC</option>
                <option value="PlayStation5">PlayStation 5</option>
                <option value="NintendoSwitch">Nintendo Switch</option>
              </NativeSelect>
            </div>

            <div className="xamk-field-group">
              <Label htmlFor="wish-desc">{t('wishlist.reasonDesc')}</Label>
              <Textarea
                id="wish-desc"
                rows={3}
                placeholder={t('wishlist.reasonPlaceholder')}
                value={wishDesc}
                onChange={(e) => setWishDesc(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsWishModalOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="pill"
                disabled={wishMutation.isPending || !wishName.trim()}
              >
                <span>
                  {wishMutation.isPending ? t('common.submitting') : t('wishlist.submitWish')}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
