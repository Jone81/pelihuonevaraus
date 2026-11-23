/**
 * @file AdminNewsView.tsx
 * @description Ylläpitopaneelin uutisten ja tiedotteiden hallintanäkymä.
 * Näyttää julkaistut tiedotteet selkeänä listana ja tarjoaa Radix Dialog -modaalin
 * uuden tiedotteen kirjoittamiseen muotoilupainikkeineen, esikatseluineen ja kiinnityksineen.
 */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Link, Eye, EyeOff, Pin, Pencil, Save, ChevronLeft } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import type { CreateNewsRequest, NewsItem, UpdateNewsRequest } from '../../types';

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
 * Lomakekortti tiedotteen julkaisuun tai olemassa olevan tiedotteen muokkaamiseen.
 */
interface NewsFormCardProps {
  /** Onko kyseessä olemassa olevan tiedotteen muokkaus */
  isEdit: boolean;
  /** Englanninkielisen käyttöliittymän tila */
  isEn: boolean;
  /** Muokattava tiedote (jos muokkaustilassa) */
  initialNews?: NewsItem;
  /** Tallennuksen keskeneräisyystila */
  isPending: boolean;
  /** Peruutus- tai paluutoiminto listaukseen */
  onCancel: () => void;
  /** Lomakkeen lähetystoiminto */
  onSubmit: (title: string, content: string, isPinned: boolean) => void;
}

/**
 * Avainnettu lomakekomponentti tiedotteen luontiin ja muokkaukseen ilman sivuvaikutuksia.
 */
const NewsFormCard: React.FC<NewsFormCardProps> = ({
  isEdit,
  isEn,
  initialNews,
  isPending,
  onCancel,
  onSubmit,
}) => {
  const [newsTitle, setNewsTitle] = useState(initialNews?.title ?? '');
  const [newsContent, setNewsContent] = useState(initialNews?.content ?? '');
  const [newsIsPinned, setNewsIsPinned] = useState(initialNews?.isPinned ?? false);
  const [previewNews, setPreviewNews] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;
    onSubmit(newsTitle.trim(), newsContent.trim(), newsIsPinned);
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <CardTitle>
            {isEdit
              ? isEn
                ? 'Edit announcement'
                : 'Muokkaa tiedotetta'
              : isEn
              ? 'Publish new announcement'
              : 'Julkaise uusi tiedote'}
          </CardTitle>
          <div className="w-12 h-1 bg-[#FACC15] mt-1.5 mb-2" />
          <CardDescription>
            {isEdit
              ? isEn
                ? 'Changes are visible immediately on the landing page and top hero banner after saving.'
                : 'Muutokset päivittyvät etusivulle sekä yläbanneriin heti tallennuksen jälkeen.'
              : isEn
              ? 'Announcements appear on the landing page and optionally pinned in the top hero banner.'
              : 'Tiedotteet näkyvät etusivulla sekä kiinnitettynä pelihuoneen yläbannerissa.'}
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={onCancel}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>{isEn ? 'Back to announcements' : 'Takaisin tiedotteisiin'}</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-news-title">
            {isEn ? 'Headline *' : 'Tiedotteen otsikko *'}
          </Label>
          <Input
            id="admin-news-title"
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
          <Label htmlFor="admin-news-content">
            {isEn ? 'Announcement content *' : 'Tiedotteen sisältö *'}
          </Label>
          <Textarea
            id="admin-news-content"
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

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            {isEn ? 'Cancel' : 'Peruuta'}
          </Button>
          <Button type="submit" variant="pill" disabled={isPending}>
            {isEdit ? (
              <Save className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            )}
            <span>
              {isPending
                ? isEn
                  ? 'Saving...'
                  : 'Tallennetaan...'
                : isEdit
                ? isEn
                  ? 'Save changes'
                  : 'Tallenna muutokset'
                : isEn
                ? 'Publish announcement'
                : 'Julkaise tiedote'}
            </span>
          </Button>
        </div>
      </form>
    </Card>
  );
};

/**
 * Tiedotteiden hallintanäkymä ylläpitopaneelissa.
 */
export const AdminNewsView: React.FC<AdminNewsViewProps> = ({
  onStatus,
  onError,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const { pathname, navigate } = useRouter();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const cleanPath = pathname.replace(/\/+$/, '');
  const isCreateRoute = cleanPath === '/admin/news/new';
  const isEditRoute = cleanPath === '/admin/news/edit' || cleanPath.startsWith('/admin/news/edit/');
  const editIdParam = cleanPath.startsWith('/admin/news/edit/')
    ? cleanPath.slice('/admin/news/edit/'.length)
    : null;

  const { data: allNews } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
    enabled: isAdmin,
  });

  const editingNews = isEditRoute
    ? (editIdParam ? allNews?.find((n) => n.id === editIdParam) : allNews?.[0])
    : undefined;

  // Luo tiedote
  const createNewsMutation = useMutation({
    mutationFn: (req: CreateNewsRequest) => api.createNews(req, user?.id ?? ''),
    onSuccess: () => {
      onStatus(isEn ? 'Announcement published.' : 'Uusi tiedote julkaistu.');
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['news'] });
      navigate('/admin/news');
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

  // Muokkaa olemassa olevaa tiedotetta
  const updateNewsMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateNewsRequest }) =>
      api.updateNews(id, req, user?.id ?? ''),
    onSuccess: () => {
      onStatus(isEn ? 'Announcement updated.' : 'Tiedote päivitetty.');
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['news'] });
      navigate('/admin/news');
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update announcement.'
          : 'Tiedotteen muokkaus epäonnistui.'
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

  if (isCreateRoute || isEditRoute) {
    return (
      <NewsFormCard
        key={isEditRoute ? `edit-${editingNews?.id ?? 'loading'}` : 'create-new'}
        isEdit={isEditRoute}
        isEn={isEn}
        initialNews={editingNews}
        isPending={createNewsMutation.isPending || updateNewsMutation.isPending}
        onCancel={() => navigate('/admin/news')}
        onSubmit={(title, content, isPinned) => {
          if (isEditRoute && editingNews) {
            updateNewsMutation.mutate({
              id: editingNews.id,
              req: { title, content, isPinned },
            });
            return;
          }
          createNewsMutation.mutate({
            title,
            content,
            authorUserId: user?.id ?? '',
            isPinned,
          });
        }}
      />
    );
  }

  return (
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
          onClick={() => navigate('/admin/news/new')}
        >
          <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>{isEn ? 'Publish new announcement' : 'Julkaise uusi tiedote'}</span>
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <time className="font-mono text-xs font-bold text-[#9CA3AF]">
                    {new Date(news.createdAtUtc).toLocaleDateString('fi-FI')}
                  </time>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/admin/news/edit/${news.id}`)}
                  >
                    <Pencil className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? 'Edit' : 'Muokkaa'}</span>
                  </Button>
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
  );
};
