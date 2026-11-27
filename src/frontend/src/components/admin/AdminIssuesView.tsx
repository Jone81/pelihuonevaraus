/**
 * @file AdminIssuesView.tsx
 * @description Ylläpitopaneelin vikailmoitusten käsittelynäkymä.
 * Mahdollistaa vikailmoitusten suodattamisen (kaikki / avoimet / ratkaistut),
 * ylläpitomuistiinpanojen kirjaamisen ja ilmoitusten kuittaamisen ratkaistuiksi.
 */
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Monitor, User } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * AdminIssuesView-komponentin ominaisuudet.
 */
export interface AdminIssuesViewProps {
  /** Callback onnistumisviestin näyttämiseen */
  onStatus: (msg: string | null) => void;
  /** Callback virheviestin näyttämiseen */
  onError: (msg: string | null) => void;
}

/**
 * Vikailmoitusten tarkastelu- ja kuittausnäkymä ylläpitäjille.
 */
export const AdminIssuesView: React.FC<AdminIssuesViewProps> = ({
  onStatus,
  onError,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const [issueFilter, setIssueFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({});

  const { data: allIssues } = useQuery({
    queryKey: ['issues'],
    queryFn: () => api.getIssueReports(user?.id ?? ''),
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  const resolveIssueMutation = useMutation({
    mutationFn: ({ issueId, notes }: { issueId: string; notes?: string }) =>
      api.resolveIssueReport(issueId, { adminNotes: notes }, user?.id ?? ''),
    onSuccess: () => {
      onStatus(isEn ? 'Issue marked as resolved.' : 'Vikailmoitus merkitty ratkaistuksi.');
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
            ? 'Failed to resolve issue.'
            : 'Vikailmoituksen kuittaus epäonnistui.'
      );
    },
  });

  const openIssuesCount = useMemo(
    () => (allIssues ?? []).filter((i) => !i.isResolved).length,
    [allIssues]
  );

  const filteredIssues = useMemo(() => {
    return (allIssues ?? []).filter((issue) => {
      if (issueFilter === 'OPEN') return !issue.isResolved;
      if (issueFilter === 'RESOLVED') return issue.isResolved;
      return true;
    });
  }, [allIssues, issueFilter]);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <CardTitle className="inline-flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#EF4444]" strokeWidth={2.5} aria-hidden="true" />
            <span>
              {isEn ? 'Hardware and software issue reports' : 'Saapuneet vika- ja virheilmoitukset'}
            </span>
          </CardTitle>
          <div className="w-12 h-1 bg-[#FACC15] mt-1.5 mb-2" />
          <CardDescription>
            {isEn
              ? 'Review and resolve student reports regarding gaming stations, peripherals, or room condition.'
              : 'Opiskelijoiden ja käyttäjien lähettämät ilmoitukset laitevioista, ohjelmisto-ongelmista ja tilan kunnosta.'}
          </CardDescription>
        </div>

        <Tabs
          value={issueFilter}
          onValueChange={(v) => setIssueFilter(v as 'ALL' | 'OPEN' | 'RESOLVED')}
        >
          <TabsList className="w-full">
            <TabsTrigger value="ALL">
              {isEn ? 'All' : 'Kaikki'} ({allIssues?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="OPEN">
              {isEn ? 'Open' : 'Avoimet'} ({openIssuesCount})
            </TabsTrigger>
            <TabsTrigger value="RESOLVED">
              {isEn ? 'Resolved' : 'Ratkaistut'} ({(allIssues?.length ?? 0) - openIssuesCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="rounded-none bg-[#121417] border-2 border-[#3F444E] p-8 text-center font-mono text-sm font-bold text-[#9CA3AF]">
          <p className="m-0">
            {isEn
              ? 'No issue reports matching the selected filter.'
              : 'Ei rekisteröityjä vikailmoituksia valitulla suodattimella.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className={`rounded-none bg-[#121417] border-2 shadow-[4px_4px_0px_#000000] p-4 flex flex-col gap-3 ${issue.isResolved ? 'border-[#22C55E]' : 'border-[#EF4444]'
                }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#1C1F24] border border-[#3F444E] font-mono text-xs font-bold text-[#F4F4F5]">
                    <Monitor className="w-3.5 h-3.5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                    <span>{issue.target}</span>
                  </span>
                  <Badge variant={issue.isResolved ? 'installed' : 'wishlist'}>
                    {issue.isResolved
                      ? isEn
                        ? 'RESOLVED'
                        : 'RATKAISTU'
                      : isEn
                        ? 'OPEN'
                        : 'AVOIN'}
                  </Badge>
                  <time className="font-mono text-xs font-bold text-[#9CA3AF]">
                    {new Date(issue.createdAt).toLocaleDateString('fi-FI', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>

                {issue.reporterEmail && (
                  <div className="font-mono text-xs font-bold text-[#9CA3AF] inline-flex items-center gap-1.5 min-w-0">
                    <User className="w-3.5 h-3.5 shrink-0 text-[#3B82F6]" strokeWidth={2.5} aria-hidden="true" />
                    <span className="break-all">
                      {issue.reporterName || (isEn ? 'Student' : 'Opiskelija')} ({issue.reporterEmail})
                    </span>
                  </div>
                )}
              </div>

              <h4 className="font-extrabold uppercase tracking-tight text-base text-[#F4F4F5] m-0">
                {issue.title}
              </h4>
              <p className="text-sm text-[#D1D5DB] leading-relaxed m-0">{issue.description}</p>

              {issue.isResolved ? (
                <div className="rounded-none bg-[#22C55E]/15 border-2 border-[#22C55E] px-3.5 py-2.5 text-xs text-[#D1D5DB] leading-relaxed">
                  <strong className="font-mono font-bold uppercase text-[#86EFAC]">
                    {isEn ? 'Resolution:' : 'Ratkaistu:'}
                  </strong>{' '}
                  {issue.adminNotes ||
                    (isEn
                      ? 'Marked resolved without additional notes.'
                      : 'Kuitattu ilman lisähuomioita.')}
                  {issue.resolvedAt && (
                    <span className="font-mono font-bold text-[#9CA3AF]">
                      {' '}
                      (
                      {new Date(issue.resolvedAt).toLocaleDateString('fi-FI', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      )
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder={
                        isEn
                          ? 'Add resolution note, for example replaced cable or updated driver...'
                          : 'Kirjaa toimenpide, esimerkiksi näytön kaapeli vaihdettu...'
                      }
                      value={resolveNotes[issue.id] || ''}
                      onChange={(e) =>
                        setResolveNotes((prev) => ({ ...prev, [issue.id]: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="pill"
                    onClick={() =>
                      resolveIssueMutation.mutate({
                        issueId: issue.id,
                        notes: resolveNotes[issue.id]?.trim(),
                      })
                    }
                    disabled={resolveIssueMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? 'Mark resolved' : 'Merkitse ratkaistuksi'}</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
