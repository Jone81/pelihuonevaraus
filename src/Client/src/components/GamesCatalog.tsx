import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import {
  Gamepad2,
  Monitor,
  Gamepad,
  Sparkles,
  Plus,
  ThumbsUp,
  Check,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';
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
      }, 1600);
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

  const getPlatformBadge = (platform: string) => {
    if (platform === 'PlayStation5') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
          <Gamepad2 className="w-3 h-3 text-purple-400" />
          <span>PlayStation 5</span>
        </span>
      );
    }
    if (platform === 'NintendoSwitch') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
          <Gamepad className="w-3 h-3 text-rose-400" />
          <span>Nintendo Switch</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
        <Monitor className="w-3 h-3 text-cyan-400" />
        <span>PC Steam</span>
      </span>
    );
  };

  return (
    <div className="w-full max-w-full flex flex-col gap-6">
      {/* Yläkortti: Otsikko, suodattimet & Ehdota peliä */}
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white font-sans">
                {t('games.title')}
              </h2>
            </div>
            <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
            <p className="text-xs text-gray-400 mt-2">{t('games.subtitle')}</p>
          </div>

          <button
            type="button"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] hover:brightness-110 active:scale-[0.99] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            onClick={() => setIsWishModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>{t('wishlist.propose')}</span>
          </button>
        </div>

        {/* Alustasuodatin (Dock-tyyli) */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#252936]">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'ALL'
                ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
                : 'bg-[#111318] text-gray-400 hover:text-white border border-[#2d323f]'
            }`}
            onClick={() => setSelectedFilter('ALL')}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('games.filterAll')}</span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'PC'
                ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
                : 'bg-[#111318] text-gray-400 hover:text-white border border-[#2d323f]'
            }`}
            onClick={() => setSelectedFilter('PC')}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC</span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'PlayStation5'
                ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
                : 'bg-[#111318] text-gray-400 hover:text-white border border-[#2d323f]'
            }`}
            onClick={() => setSelectedFilter('PlayStation5')}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>PlayStation 5</span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'NintendoSwitch'
                ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
                : 'bg-[#111318] text-gray-400 hover:text-white border border-[#2d323f]'
            }`}
            onClick={() => setSelectedFilter('NintendoSwitch')}
          >
            <Gamepad className="w-3.5 h-3.5" />
            <span>Nintendo Switch</span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'WISHLIST'
                ? 'bg-[#d89619] text-[#0a0b0d] font-bold shadow-xs'
                : 'bg-[#111318] text-gray-400 hover:text-white border border-[#2d323f]'
            }`}
            onClick={() => setSelectedFilter('WISHLIST')}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('wishlist.tabWishlist')}</span>
            {wishlistCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                selectedFilter === 'WISHLIST' ? 'bg-[#0a0b0d] text-[#fbba18]' : 'bg-[#fbba18]/20 text-[#fbba18]'
              }`}>
                {wishlistCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Toivelistan esittelybanneri jos Toivelista-välilehti on valittuna */}
      {selectedFilter === 'WISHLIST' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#fbba18]/10 border border-[#fbba18]/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#fbba18] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-white">{t('wishlist.introTitle')}</h3>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{t('wishlist.introDesc')}</p>
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[#d89619] hover:bg-[#c48410] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-md"
            onClick={() => setIsWishModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>{t('wishlist.proposeNew')}</span>
          </button>
        </div>
      )}

      {/* Peliruudukko */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400 bg-[#181a20] rounded-2xl border border-[#2d323f]">
          <div className="w-6 h-6 border-2 border-[#d89619] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">{t('games.loading')}</span>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-xs bg-[#181a20] rounded-2xl border border-[#2d323f]">
          {selectedFilter === 'WISHLIST' ? t('games.emptyWishlist') : t('games.emptyCategory')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className={`bg-[#181a20] border rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-3 transition-all hover:border-[#fbba18]/50 ${
                game.isWishlist ? 'border-[#d89619]/40 bg-[#d89619]/5' : 'border-[#2d323f]'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  {getPlatformBadge(game.platform)}
                  {game.isWishlist ? (
                    <span className="text-[10px] font-bold text-[#fbba18] bg-[#fbba18]/15 border border-[#fbba18]/30 px-2 py-0.5 rounded-full">
                      {game.votesCount || 0} {t('wishlist.votes')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      {t('games.installed')}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white leading-tight mt-1">{game.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                  {game.description || t('games.noDesc')}
                </p>
              </div>

              {/* Toivelista-äänestyspainike */}
              {game.isWishlist && (
                <div className="pt-2 border-t border-[#252936]">
                  <button
                    type="button"
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      votedGameIds.has(game.id)
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                        : 'bg-[#111318] hover:bg-[#1f232e] border border-[#2d323f] text-gray-200 hover:text-[#fbba18]'
                    }`}
                    onClick={() => handleVote(game.id)}
                    disabled={votedGameIds.has(game.id) || voteMutation.isPending}
                  >
                    {votedGameIds.has(game.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('wishlist.voted')}</span>
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-3.5 h-3.5 text-[#fbba18]" />
                        <span>{t('wishlist.vote')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ehdota peliä -Modaali */}
      {isWishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-2 border-b border-[#2d323f]">
              <div className="flex flex-col">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#fbba18]" />
                  <span>{t('wishlist.modalTitle')}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">{t('wishlist.modalDesc')}</p>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setIsWishModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {wishSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                {wishSuccess}
              </div>
            )}

            {wishError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{wishError}</span>
              </div>
            )}

            <form onSubmit={handleWishSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('wishlist.gameName')} *
                </label>
                <input
                  type="text"
                  placeholder={t('wishlist.gameNamePlaceholder')}
                  className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('wishlist.platform')}
                </label>
                <select
                  className="w-full h-10 bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl px-3 text-xs outline-none transition-colors cursor-pointer"
                  value={wishPlatform}
                  onChange={(e) => setWishPlatform(e.target.value)}
                >
                  <option value="PC">PC</option>
                  <option value="PlayStation5">PlayStation 5</option>
                  <option value="NintendoSwitch">Nintendo Switch</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('wishlist.reasonDesc')}
                </label>
                <textarea
                  rows={3}
                  placeholder={t('wishlist.reasonPlaceholder')}
                  className="w-full bg-[#111318] border border-[#2d323f] focus:border-[#fbba18] text-white rounded-xl p-3 text-xs outline-none transition-colors resize-none"
                  value={wishDesc}
                  onChange={(e) => setWishDesc(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2d323f]">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#1c1f28] border border-[#2d323f] text-gray-300 text-xs font-semibold cursor-pointer"
                  onClick={() => setIsWishModalOpen(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                  disabled={wishMutation.isPending}
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
