/**
 * @file NewsFeedPage.tsx
 * @description Kirjautuneen käyttäjän etusivu (`/`), joka näyttää uutiset ja tiedotteet
 * pelkistetysti ilman muita toimintoja. Pääsy sivulle tapahtuu klikkaamalla Xamk-logoa.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, Pin } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Pelkistetty Uutiset ja tiedotteet -näkymä polulle `/`.
 */
export const NewsFeedPage: React.FC = () => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  const { data: newsList, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
  });

  const items = newsList ?? [];

  return (
    <Card className="bg-[#1C1F24] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shrink-0"
            aria-hidden="true"
          >
            <Newspaper className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl">
              {isEn ? 'News & announcements' : 'Uutiset ja tiedotteet'}
            </CardTitle>
            <div className="w-12 h-1 bg-[#FACC15] mt-1.5" />
          </div>
        </div>

        <Badge variant="status">
          {items.length} {isEn ? 'notices' : 'tiedotetta'}
        </Badge>
      </div>

      {isLoading ? (
        <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-8 text-center font-mono text-sm font-bold text-[#9CA3AF]">
          {isEn ? 'Loading announcements...' : 'Ladataan tiedotteita...'}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-8 text-center font-mono text-sm font-bold text-[#9CA3AF]">
          {isEn ? 'No announcements published yet.' : 'Ei vielä julkaistuja tiedotteita.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((item) => (
            <article
              key={item.id}
              className={`rounded-none bg-[#121417] p-4 sm:p-5 flex flex-col gap-2.5 border-2 shadow-[4px_4px_0px_#000000] ${
                item.isPinned ? 'border-[#FACC15]' : 'border-[#3F444E]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge variant={item.isPinned ? 'default' : 'status'} className="inline-flex items-center gap-1.5">
                  {item.isPinned && <Pin className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />}
                  <span>
                    {item.isPinned
                      ? isEn
                        ? 'Pinned notice'
                        : 'Kiinnitetty tiedote'
                      : isEn
                      ? 'Notice'
                      : 'Tiedote'}
                  </span>
                </Badge>
                <time className="font-mono text-xs font-bold text-[#9CA3AF]">
                  {new Date(item.createdAtUtc).toLocaleDateString('fi-FI')}
                </time>
              </div>
              <h3 className="font-extrabold uppercase tracking-tight text-base sm:text-lg text-[#F4F4F5] m-0">
                {item.title}
              </h3>
              <p className="text-sm text-[#D1D5DB] leading-relaxed m-0 whitespace-pre-wrap">
                {item.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
};
