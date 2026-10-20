import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
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
      <div className="section-header">
        <div>
          <h2>🎮 {t('games.title')}</h2>
          <p className="section-description">
            {t('games.subtitle')}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-touch"
          onClick={() => setIsWishModalOpen(true)}
        >
          {t('wishlist.propose')}
        </button>
      </div>

      {/* Suodatusnapit */}
      <div className="catalog-filters" role="tablist" aria-label="Pelialustat">
        <button
          type="button"
          className={`filter-btn btn-touch ${selectedFilter === 'ALL' ? 'filter-active' : ''}`}
          onClick={() => setSelectedFilter('ALL')}
        >
          {t('games.filterAll')}
        </button>
        <button
          type="button"
          className={`filter-btn btn-touch ${selectedFilter === 'PC' ? 'filter-active' : ''}`}
          onClick={() => setSelectedFilter('PC')}
        >
          🖥️ PC
        </button>
        <button
          type="button"
          className={`filter-btn btn-touch ${selectedFilter === 'PlayStation5' ? 'filter-active' : ''}`}
          onClick={() => setSelectedFilter('PlayStation5')}
        >
          🎮 PlayStation 5
        </button>
        <button
          type="button"
          className={`filter-btn btn-touch ${selectedFilter === 'NintendoSwitch' ? 'filter-active' : ''}`}
          onClick={() => setSelectedFilter('NintendoSwitch')}
        >
          🕹️ Nintendo Switch
        </button>
        <button
          type="button"
          className={`filter-btn btn-touch ${selectedFilter === 'WISHLIST' ? 'filter-active' : ''}`}
          onClick={() => setSelectedFilter('WISHLIST')}
          style={{ position: 'relative' }}
        >
          ⭐ {t('wishlist.tabWishlist')}
          {wishlistCount > 0 && (
            <span className="badge-counter">{wishlistCount}</span>
          )}
        </button>
      </div>

      {selectedFilter === 'WISHLIST' && (
        <div className="wishlist-intro-banner">
          <div className="wishlist-intro-text">
            <h3>{t('wishlist.introTitle')}</h3>
            <p>{t('wishlist.introDesc')}</p>
          </div>
          <button
            type="button"
            className="btn btn-accent btn-touch"
            onClick={() => setIsWishModalOpen(true)}
          >
            {t('wishlist.proposeNew')}
          </button>
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
              <div className="game-card-header">
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
                  <span className="installed-badge">✅ {t('games.installed')}</span>
                )}
              </div>

              <h3 className="game-title">{game.name}</h3>
              <p className="game-desc">{game.description || t('games.noDesc')}</p>

              {game.isWishlist && (
                <div className="wishlist-vote-action">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      votedGameIds.has(game.id) ? 'btn-secondary' : 'btn-primary'
                    }`}
                    onClick={() => handleVote(game.id)}
                    disabled={votedGameIds.has(game.id) || voteMutation.isPending}
                  >
                    {votedGameIds.has(game.id) ? `✓ ${t('wishlist.voted')}` : `👍 ${t('wishlist.vote')} (+1)`}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ehdota peliä -modaali */}
      {isWishModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsWishModalOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('wishlist.modalTitle')}</h2>
              <button
                type="button"
                className="btn-close btn-touch"
                onClick={() => setIsWishModalOpen(false)}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <p className="modal-description">
              {t('wishlist.modalDesc')}
            </p>

            {wishSuccess && <div className="alert alert-success">{wishSuccess}</div>}
            {wishError && <div className="alert alert-error">{wishError}</div>}

            <form onSubmit={handleWishSubmit} className="form">
              <div className="form-group">
                <label htmlFor="wish-name">{t('wishlist.gameName')} *</label>
                <input
                  id="wish-name"
                  type="text"
                  className="input-touch"
                  placeholder={t('wishlist.gameNamePlaceholder')}
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="wish-platform">{t('wishlist.platform')} *</label>
                <select
                  id="wish-platform"
                  className="input-touch"
                  value={wishPlatform}
                  onChange={(e) => setWishPlatform(e.target.value)}
                >
                  <option value="PC">🖥️ PC</option>
                  <option value="PlayStation5">🎮 PlayStation 5</option>
                  <option value="NintendoSwitch">🕹️ Nintendo Switch</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="wish-desc">{t('wishlist.reasonDesc')}</label>
                <input
                  id="wish-desc"
                  type="text"
                  className="input-touch"
                  placeholder={t('wishlist.reasonPlaceholder')}
                  value={wishDesc}
                  onChange={(e) => setWishDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-touch"
                  onClick={() => setIsWishModalOpen(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-touch"
                  disabled={wishMutation.isPending || !wishName.trim()}
                >
                  {wishMutation.isPending ? t('common.submitting') : t('wishlist.submitWish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
