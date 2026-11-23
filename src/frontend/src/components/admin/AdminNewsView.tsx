/**
 * @file AdminNewsView.tsx
 * @description Ylläpitopaneelin uutisten ja tiedotteiden hallintanäkymä.
 * Näyttää julkaistut tiedotteet selkeänä listana ja tarjoaa Radix Dialog -modaalin
 * uuden tiedotteen kirjoittamiseen muotoilupainikkeineen, esikatseluineen ja kiinnityksineen.
 */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Link, Eye, EyeOff, Pin } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { CreateNewsRequest } from '../../types';

/**
 * AdminNewsView-komponentin ominaisuudet.
 */
export interface AdminNewsViewProps {
  /** Callback onnistumisviestin näyttämiseen */
  onStatus: (msg: string | null) => void;
  /** Callback virheviestin näyttämiseen */
  onError: (msg: string | null) => void;
}

/**
 * Tiedotteiden hallintanäkymä ylläpitopaneelissa.
 */
export const AdminNewsView: React.FC<AdminNewsViewProps> = ({
  onStatus,
  onError,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsIsPinned, setNewsIsPinned] = useState(false);
  const [previewNews, setPreviewNews] = useState(false);

  const { data: allNews } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
    enabled: isAdmin,
  });

  // Luo tiedote
  const createNewsMutation = useMutation({
    mutationFn: (req: CreateNewsRequest) => api.createNews(req, user?.id ?? ''),
    onSuccess: () => {
      onStatus(isEn ? 'Announcement published.' : 'Uusi tiedote julkaistu.');
      onError(null);
      setNewsTitle('');
      setNewsContent('');
      setNewsIsPinned(false);
      setPreviewNews(false);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
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
      onStatus(isEn ? 'Announcement deleted.' : 'Tiedote poistettu.');
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to delete announcement.'
          : 'Tiedotteen poisto epäonnistui.'
      );
    },
  });

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

  return (
    <>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle>
              {isEn ? 'Published announcements' : 'Julkaistut tiedotteet'} ({allNews?.length ?? 0})
            </CardTitle>
            <div className="w-12 h-1 bg-[#FACC15] mt-1.5 mb-2" />
            <CardDescription>
              {isEn
                ? 'Manage active announcements currently visible to students and staff on the landing page and hero banner.'
                : 'Hallinnoi opiskelijoille ja henkilökunnalle näkyviä aktiivisia tiedotteita etusivulla ja yläbannerissa.'}
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="pill"
            className="shrink-0"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span>{isEn ? 'Publish announcement' : 'Julkaise tiedote'}</span>
          </Button>
        </div>

        {(allNews ?? []).length === 0 ? (
          <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-8 text-center font-mono text-sm font-bold text-[#9CA3AF]">
            {isEn
              ? 'No published announcements yet.'
              : 'Ei vielä julkaistuja tiedotteita.'}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {(allNews ?? []).map((news) => (
              <article
                key={news.id}
                className={`rounded-none bg-[#121417] p-4 flex flex-col gap-2.5 border-2 shadow-[4px_4px_0px_#000000] ${
                  news.isPinned ? 'border-[#FACC15]' : 'border-[#3F444E]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="status">
                    {news.isPinned
                      ? isEn
                        ? 'Pinned'
                        : 'Kiinnitetty'
                      : isEn
                      ? 'Notice'
                      : 'Tiedote'}
                  </Badge>
                  <div className="flex items-center gap-2.5">
                    <time className="font-mono text-xs font-bold text-[#9CA3AF]">
                      {new Date(news.createdAtUtc).toLocaleDateString('fi-FI')}
                    </time>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteNewsMutation.mutate(news.id)}
                      disabled={deleteNewsMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      <span>{isEn ? 'Delete' : 'Poista'}</span>
                    </Button>
                  </div>
                </div>
                <h4 className="font-extrabold uppercase tracking-tight text-base text-[#F4F4F5] m-0">
                  {news.title}
                </h4>
                <p className="text-sm text-[#D1D5DB] leading-relaxed m-0 whitespace-pre-wrap">
                  {news.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </Card>

      {/* Julkaise tiedote -modaali */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEn ? 'Publish new announcement' : 'Julkaise uusi tiedote'}
            </DialogTitle>
            <div className="w-12 h-1 bg-[#FACC15]" />
            <DialogDescription>
              {isEn
                ? 'Announcements appear on the landing page and optionally pinned in the top hero banner.'
                : 'Tiedotteet näkyvät etusivulla sekä kiinnitettynä pelihuoneen yläbannerissa.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNews} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-news-title">
                {isEn ? 'Headline *' : 'Tiedotteen otsikko *'}
              </Label>
              <Input
                id="modal-news-title"
                type="text"
                placeholder={
                  isEn
                    ? 'For example Friday CS2 tournament starts at 14:00'
                    : 'Esimerkiksi Perjantain CS2-turnaus alkaa klo 14:00'
                }
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-none bg-[#121417] border border-[#3F444E]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mr-1">
                {isEn ? 'Format:' : 'Muotoile:'}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] font-mono text-xs font-bold cursor-pointer hover:border-[#FACC15] hover:bg-[#252930]"
                onClick={() =>
                  setNewsContent((c) => c + (isEn ? ' **bold text**' : ' **lihavoitu teksti**'))
                }
              >
                <strong>B</strong> {isEn ? 'Bold' : 'Lihavoi'}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] font-mono text-xs font-bold cursor-pointer hover:border-[#FACC15] hover:bg-[#252930]"
                onClick={() =>
                  setNewsContent((c) => c + (isEn ? '\n- Item 1\n- Item 2' : '\n- Kohta 1\n- Kohta 2'))
                }
              >
                - {isEn ? 'List' : 'Lista'}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] font-mono text-xs font-bold cursor-pointer hover:border-[#FACC15] hover:bg-[#252930]"
                onClick={() =>
                  setNewsContent(
                    (c) =>
                      c + (isEn ? ' [Link](https://www.xamk.fi)' : ' [Linkki](https://www.xamk.fi)')
                  )
                }
              >
                <Link className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                <span>{isEn ? 'Link' : 'Linkki'}</span>
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-none border font-mono text-xs font-bold cursor-pointer ${
                  previewNews
                    ? 'bg-[#FACC15] text-[#09090B] border-black font-extrabold'
                    : 'bg-[#1C1F24] text-[#F4F4F5] border-[#3F444E] hover:border-[#FACC15] hover:bg-[#252930]'
                }`}
                onClick={() => setPreviewNews(!previewNews)}
              >
                {previewNews ? (
                  <EyeOff className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <Eye className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                )}
                <span>
                  {previewNews
                    ? isEn
                      ? 'Hide preview'
                      : 'Piilota esikatselu'
                    : isEn
                    ? 'Preview'
                    : 'Esikatsele'}
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-news-content">
                {isEn ? 'Announcement content *' : 'Tiedotteen sisältö *'}
              </Label>
              <Textarea
                id="modal-news-content"
                rows={5}
                placeholder={
                  isEn ? 'Write the announcement details...' : 'Kirjoita tiedotteen sisältö...'
                }
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                required
              />
            </div>

            {previewNews && (
              <div className="rounded-none bg-[#121417] border-2 border-[#FACC15] shadow-[4px_4px_0px_#000000] p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="status">
                    {newsIsPinned
                      ? isEn
                        ? 'Pinned notice'
                        : 'Kiinnitetty tiedote'
                      : isEn
                      ? 'Preview'
                      : 'Esikatselu'}
                  </Badge>
                  <time className="font-mono text-xs font-bold text-[#9CA3AF]">
                    {new Date().toLocaleDateString('fi-FI')}
                  </time>
                </div>
                <h4 className="font-extrabold uppercase tracking-tight text-base text-[#F4F4F5] m-0">
                  {newsTitle || (isEn ? 'Headline preview' : 'Tiedotteen otsikko')}
                </h4>
                <p className="text-sm text-[#D1D5DB] leading-relaxed m-0 whitespace-pre-wrap">
                  {newsContent || (isEn ? 'Content preview...' : 'Tiedotteen sisältöteksti...')}
                </p>
              </div>
            )}

            <label className="flex items-start gap-3 p-3.5 rounded-none bg-[#121417] border-2 border-[#3F444E] cursor-pointer hover:border-[#FACC15] transition-colors">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#FACC15] rounded-none cursor-pointer"
                checked={newsIsPinned}
                onChange={(e) => setNewsIsPinned(e.target.checked)}
              />
              <div className="flex flex-col gap-1">
                <strong className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                  <Pin className="w-3.5 h-3.5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                  <span>
                    {isEn
                      ? 'Pin to hero banner and top of feed'
                      : 'Kiinnitä tiedote yläbanneriin ja uutislistan kärkeen'}
                  </span>
                </strong>
                <span className="text-xs text-[#9CA3AF] leading-snug">
                  {isEn
                    ? 'Pinned announcements are highlighted in gold on the welcome banner.'
                    : 'Kiinnitetty tiedote korostetaan kultaisella reunuksella etusivulla.'}
                </span>
              </div>
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createNewsMutation.isPending}
              >
                {isEn ? 'Cancel' : 'Peruuta'}
              </Button>
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
                    ? 'Publish announcement'
                    : 'Julkaise tiedote'}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
