import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from '@/components/ui/badge';

export const NewsBanner: React.FC = () => {
  const { t, lang } = useLanguage();
  const { data: newsList } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
  });

  if (!newsList || newsList.length === 0) {
    return null;
  }

  const pinnedNews = newsList.filter((n) => n.isPinned);
  const displayNews = pinnedNews.length > 0 ? pinnedNews : newsList.slice(0, 1);

  return (
    <div className="news-banner" role="region" aria-label={t('news.badge')}>
      {displayNews.map((item) => (
        <div key={item.id} className="news-item">
          <div className="news-header">
            <Badge variant={item.isPinned ? 'xamk' : 'secondary'} className="text-xs">
              {item.isPinned ? t('news.pinned') : t('news.badge')}
            </Badge>
            <span className="news-title">{item.title}</span>
            <span className="news-date">
              {new Date(item.createdAtUtc).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fi-FI')}
            </span>
          </div>
          <p className="news-content">{item.content}</p>
        </div>
      ))}
    </div>
  );
};
