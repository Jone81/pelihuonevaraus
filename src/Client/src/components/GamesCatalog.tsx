import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WishGameRequest } from '../types';

export const GamesCatalog: React.FC = () => {
  const queryClient = useQueryClient();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PC' | 'PlayStation5' | 'NintendoSwitch' | 'WISHLIST'>('ALL');
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [wishName, setWishName] = useState('');
  const [wishPlatform, setWishPlatform] = useState('PC');
  const [wishDesc, setWishDesc] = useState('');
  const [wishSuccess, setWishSuccess] = useState<string | null>(null);
  const [wishError, setWishError] = useState<string | null>(null);
  const [votedGameIds, setVotedGameIds] = useState<Set<string>>(() => new Set());

  const { data: allGames, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.getGames(),
  });

  const wishMutation = useMutation({
    mutationFn: (req: WishGameRequest) => api.addWishlistGame(req),
    onSuccess: (createdGame) => {
      setWishSuccess(
        isEn
          ? `Wish added successfully: "${createdGame.name}". Admins will review the suggestion.`
          : `Toive lisätty onnistuneesti: "${createdGame.name}". Ylläpito käy toiveet läpi.`
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

  const voteMutation = useMutation({
    mutationFn: (gameId: string) => api.voteGame(gameId),
    onSuccess: (updatedGame) => {
      setVotedGameIds((prev) => new Set(prev).add(updatedGame.id));
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

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

  const handleVote = (gameId: string) => {
    if (votedGameIds.has(gameId)) return;
    voteMutation.mutate(gameId);
  };

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
          <h2>🎮 {t('games.title')}</h2>
          <p className="section-description">
            {t('games.subtitle')}
          </p>
        </div>
        <Button
          type="button"
          variant="xamk"
          className="btn-touch font-bold"
          onClick={() => setIsWishModalOpen(true)}
        >
          {t('wishlist.propose')}
        </Button>
      </div>

      {/* Suodatusnapit */}
      <div className="catalog-filters flex flex-wrap gap-2 my-4" role="tablist" aria-label="Pelialustat">
        <Button
          type="button"
          variant={selectedFilter === 'ALL' ? 'xamk' : 'secondary'}
          size="sm"
          className="btn-touch"
          onClick={() => setSelectedFilter('ALL')}
        >
          {t('games.filterAll')}
        </Button>
        <Button
          type="button"
          variant={selectedFilter === 'PC' ? 'xamk' : 'secondary'}
          size="sm"
          className="btn-touch"
          onClick={() => setSelectedFilter('PC')}
        >
          🖥️ PC
        </Button>
        <Button
          type="button"
          variant={selectedFilter === 'PlayStation5' ? 'xamk' : 'secondary'}
          size="sm"
          className="btn-touch"
          onClick={() => setSelectedFilter('PlayStation5')}
        >
          🎮 PlayStation 5
        </Button>
        <Button
          type="button"
          variant={selectedFilter === 'NintendoSwitch' ? 'xamk' : 'secondary'}
          size="sm"
          className="btn-touch"
          onClick={() => setSelectedFilter('NintendoSwitch')}
        >
          🕹️ Nintendo Switch
        </Button>
        <Button
          type="button"
          variant={selectedFilter === 'WISHLIST' ? 'xamk' : 'secondary'}
          size="sm"
          className="btn-touch relative"
          onClick={() => setSelectedFilter('WISHLIST')}
        >
          {t('wishlist.tabWishlist')}
          {wishlistCount > 0 && (
            <Badge variant="warning" className="ml-1.5 px-1.5 py-0 text-[10px]">
              {wishlistCount}
            </Badge>
          )}
        </Button>
      </div>

      {selectedFilter === 'WISHLIST' && (
        <div className="wishlist-intro-banner flex justify-between items-center p-4 rounded-xl border border-border bg-[#15181e] my-4 gap-4 flex-wrap">
          <div className="wishlist-intro-text">
            <h3 className="font-bold text-base text-foreground">{t('wishlist.introTitle')}</h3>
            <p className="text-sm text-[#9da3ae]">{t('wishlist.introDesc')}</p>
          </div>
          <Button
            type="button"
            variant="xamk"
            className="btn-touch font-bold"
            onClick={() => setIsWishModalOpen(true)}
          >
            {t('wishlist.proposeNew')}
          </Button>
        </div>
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
            <div key={game.id} className={`game-card ${game.isWishlist ? 'game-card-wish' : ''}`}>
              <div className="game-card-header flex items-center justify-between">
                <span className="platform-tag">
                  {game.platform === 'PC'
                    ? '🖥️ PC'
                    : game.platform === 'PlayStation5'
                    ? '🎮 PS5'
                    : '🕹️ Switch'}
                </span>
                {game.isWishlist ? (
                  <span className="wishlist-votes-badge">
                    🔥 {game.votesCount || 0} {t('wishlist.votes')}
                  </span>
                ) : (
                  <span className="status-pill pill-free" style={{ fontSize: '0.72rem' }}>
                    {t('games.installed')}
                  </span>
                )}
              </div>

              <h3 className="game-title font-bold text-lg text-foreground my-2">{game.name}</h3>
              {game.description && (
                <p className="game-description text-sm text-[#9da3ae]">{game.description}</p>
              )}

              {game.isWishlist && (
                <div className="game-card-footer mt-4 flex items-center justify-between">
                  <span className="text-xs text-[#9da3ae]">
                    {t('wishlist.communityWish')}
                  </span>
                  <Button
                    type="button"
                    variant={votedGameIds.has(game.id) ? 'secondary' : 'xamk'}
                    size="sm"
                    className="btn-touch"
                    onClick={() => handleVote(game.id)}
                    disabled={votedGameIds.has(game.id) || voteMutation.isPending}
                  >
                    {votedGameIds.has(game.id) ? '👍 ' + t('wishlist.voted') : t('wishlist.vote')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Peli-ehdotusmodaali */}
      <Dialog open={isWishModalOpen} onOpenChange={(open) => !open && setIsWishModalOpen(false)}>
        <DialogContent className="max-w-md bg-[#1c2027] border-[#2b313d] text-foreground p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {t('wishlist.modalTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#9da3ae] mt-1">
              {t('wishlist.modalDesc')}
            </DialogDescription>
          </DialogHeader>

          {wishSuccess && <div className="alert alert-success my-2">{wishSuccess}</div>}
          {wishError && <div className="alert alert-error my-2">{wishError}</div>}

          <form onSubmit={handleWishSubmit} className="space-y-4 my-2">
            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="wish-platform">{t('wishlist.platform')} *</Label>
              <select
                id="wish-platform"
                className="flex h-11 w-full rounded-xl border border-border bg-[#15181e] px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbba18]"
                value={wishPlatform}
                onChange={(e) => setWishPlatform(e.target.value)}
              >
                <option value="PC">🖥️ PC</option>
                <option value="PlayStation5">🎮 PlayStation 5</option>
                <option value="NintendoSwitch">🕹️ Nintendo Switch</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wish-desc">{t('wishlist.reasonDesc')}</Label>
              <Input
                id="wish-desc"
                type="text"
                placeholder={t('wishlist.reasonPlaceholder')}
                value={wishDesc}
                onChange={(e) => setWishDesc(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                className="btn-touch"
                onClick={() => setIsWishModalOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="xamk"
                className="btn-touch"
                disabled={wishMutation.isPending || !wishName.trim()}
              >
                {wishMutation.isPending ? t('common.submitting') : t('wishlist.submitWish')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
