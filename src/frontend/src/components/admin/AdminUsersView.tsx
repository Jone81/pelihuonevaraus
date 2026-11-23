/**
 * @file AdminUsersView.tsx
 * @description Ylläpitopaneelin käyttäjien, roolien ja käyttöestojen (bannien) hallintanäkymä.
 * Sisältää täysleveän käyttäjätaulukon, haun, roolinvaihdon (vain SuperAdmin) sekä
 * Radix Dialog -modaalin käyttäjän käyttöeston asettamiseen, päivittämiseen ja poistamiseen.
 */
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap, Lock, Shield, Ban } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
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
import type { BanUserRequest, User } from '../../types';

/**
 * AdminUsersView-komponentin ominaisuudet.
 */
export interface AdminUsersViewProps {
  /** Callback onnistumisviestin näyttämiseen */
  onStatus: (msg: string | null) => void;
  /** Callback virheviestin näyttämiseen */
  onError: (msg: string | null) => void;
}

/**
 * Käyttäjien, roolien ja käyttöestojen hallintanäkymä ylläpitopaneelissa.
 */
export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  onStatus,
  onError,
}) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const queryClient = useQueryClient();

  const [userSearch, setUserSearch] = useState('');
  const [selectedBanUser, setSelectedBanUser] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState<string>('24');
  const [banReason, setBanReason] = useState<string>('');

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getAllUsers(user?.id ?? ''),
    enabled: isAdmin,
  });

  // Päivitä käyttäjän rooli (User / Admin)
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role, user?.id ?? ''),
    onSuccess: (updatedUser) => {
      onStatus(
        isEn
          ? `User "${updatedUser.displayName}" role updated to ${updatedUser.role}.`
          : `Käyttäjän "${updatedUser.displayName}" rooli päivitetty: ${updatedUser.role}.`
      );
      onError(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update user role.'
          : 'Roolin päivitys epäonnistui.'
      );
    },
  });

  // Aseta tai poista käyttäjän määräaikainen/pysyvä käyttöesto (banni)
  const updateUserBanMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: BanUserRequest }) =>
      api.updateUserBan(userId, request, user?.id ?? ''),
    onSuccess: (updatedUser) => {
      if (updatedUser.isBanned) {
        const untilDate = updatedUser.bannedUntilUtc
          ? new Date(updatedUser.bannedUntilUtc)
          : null;
        const isPerm = untilDate && untilDate.getFullYear() >= new Date().getFullYear() + 50;
        const untilFormatted = isPerm
          ? isEn
            ? 'permanently'
            : 'pysyvästi'
          : untilDate?.toLocaleString('fi-FI', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) ?? '';
        onStatus(
          isEn
            ? `User "${updatedUser.displayName}" banned, ${untilFormatted}.`
            : `Käyttäjälle "${updatedUser.displayName}" asetettiin käyttöesto, ${untilFormatted}.`
        );
      } else {
        onStatus(
          isEn
            ? `Ban removed from user "${updatedUser.displayName}".`
            : `Käyttäjän "${updatedUser.displayName}" käyttöesto poistettiin.`
        );
      }
      onError(null);
      setSelectedBanUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      onStatus(null);
      onError(
        err instanceof ApiError
          ? err.message
          : isEn
          ? 'Failed to update user ban status.'
          : 'Käyttöeston päivitys epäonnistui.'
      );
    },
  });

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers ?? [];
    return (allUsers ?? []).filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  const handleOpenBanModal = (targetUser: User) => {
    setSelectedBanUser(targetUser);
    setBanDuration('24');
    setBanReason(targetUser.banReason ?? '');
  };

  const handleApplyBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBanUser) return;
    const isPerm = banDuration === 'permanent';
    const hours = isPerm ? null : Number(banDuration);
    updateUserBanMutation.mutate({
      userId: selectedBanUser.id,
      request: {
        durationHours: hours,
        reason: banReason.trim() || null,
        isPermanent: isPerm,
      },
    });
  };

  const handleRemoveBan = () => {
    if (!selectedBanUser) return;
    updateUserBanMutation.mutate({
      userId: selectedBanUser.id,
      request: {
        durationHours: 0,
        reason: null,
        isPermanent: false,
      },
    });
  };

  const formatBanUntil = (targetUser: User): string => {
    const bannedUntilDate = targetUser.bannedUntilUtc ? new Date(targetUser.bannedUntilUtc) : null;
    const isPerm =
      Boolean(targetUser.isBanned) &&
      bannedUntilDate !== null &&
      bannedUntilDate.getFullYear() >= new Date().getFullYear() + 50;

    if (isPerm) {
      return isEn ? 'Permanent ban' : 'Pysyvä esto';
    }
    if (!bannedUntilDate) return '';
    const formatted = bannedUntilDate.toLocaleString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return isEn ? `Until ${formatted}` : `${formatted} asti`;
  };

  return (
    <>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle>
              {isEn
                ? 'System users, access roles, and ban controls'
                : 'Järjestelmäkäyttäjät, käyttöoikeudet ja käyttöestot'}
            </CardTitle>
            <div className="w-12 h-1 bg-[#FACC15] mt-1.5 mb-2" />
            <CardDescription>
              {isEn
                ? 'Manage registered students and staff. Change roles between User and Admin, or manage temporary and permanent bans.'
                : 'Hallinnoi rekisteröityjä opiskelijoita ja henkilökuntaa. Voit muuttaa käyttäjän roolia tai hallinnoida määräaikaisia ja pysyviä käyttöestoja.'}
            </CardDescription>
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[280px]">
            <Input
              type="text"
              placeholder={
                isEn ? 'Search users by name or email...' : 'Hae nimen tai sähköpostin perusteella...'
              }
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isEn ? 'User and status' : 'Käyttäjä ja tila'}</TableHead>
              <TableHead>{isEn ? 'Email' : 'Sähköposti'}</TableHead>
              <TableHead>{isEn ? 'Current role' : 'Nykyinen rooli'}</TableHead>
              <TableHead>{isEn ? 'Change role' : 'Muuta käyttöoikeutta'}</TableHead>
              <TableHead>{isEn ? 'Ban controls' : 'Käyttöesto'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black font-mono text-xs font-extrabold shrink-0">
                        {u.displayName.charAt(0).toUpperCase()}
                      </span>
                      <strong className="font-bold text-[#F4F4F5]">{u.displayName}</strong>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {u.isBanned ? (
                        <Badge variant="wishlist">{isEn ? 'BANNED' : 'ESTETTY'}</Badge>
                      ) : (
                        <Badge variant="installed">{isEn ? 'Active' : 'Aktiivinen'}</Badge>
                      )}
                      {u.isBanned && (
                        <span className="font-mono text-[11px] font-bold text-[#FCA5A5]">
                          {formatBanUntil(u)}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-[#D1D5DB]">{u.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      u.role === 'SuperAdmin'
                        ? 'wishlist'
                        : u.role === 'Admin'
                        ? 'installed'
                        : 'status'
                    }
                  >
                    {u.role.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.role === 'SuperAdmin' ? (
                    <span className="font-mono text-xs font-bold text-[#9CA3AF] inline-flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                      <span>{isEn ? 'Primary SuperAdmin, locked' : 'Pääkäyttäjä, pysyvä oikeus'}</span>
                    </span>
                  ) : !isSuperAdmin ? (
                    <span className="font-mono text-xs font-bold text-[#9CA3AF] inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 shrink-0 text-[#9CA3AF]" strokeWidth={2.5} aria-hidden="true" />
                      <span>{isEn ? 'SuperAdmin required' : 'Vaatii SuperAdmin-oikeuden'}</span>
                    </span>
                  ) : (
                    <NativeSelect
                      wrapperClassName="max-w-[200px] min-h-[36px]"
                      value={u.role}
                      onChange={(e) =>
                        updateUserRoleMutation.mutate({ userId: u.id, role: e.target.value })
                      }
                      disabled={updateUserRoleMutation.isPending}
                    >
                      <option value="User">User ({isEn ? 'Student or staff' : 'Käyttäjä'})</option>
                      <option value="Admin">Admin ({isEn ? 'Administrator' : 'Ylläpitäjä'})</option>
                    </NativeSelect>
                  )}
                </TableCell>
                <TableCell>
                  {u.role === 'SuperAdmin' ? (
                    <span className="font-mono text-xs font-bold text-[#9CA3AF] inline-flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 shrink-0 text-[#3B82F6]" strokeWidth={2.5} aria-hidden="true" />
                      <span>{isEn ? 'Cannot be banned' : 'Pääkäyttäjää ei voi estää'}</span>
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant={u.isBanned ? 'destructive' : 'secondary'}
                      onClick={() => handleOpenBanModal(u)}
                    >
                      <Ban className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      <span>{isEn ? 'Manage ban' : 'Hallinnoi estoa'}</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Käyttöeston hallintamodaali */}
      <Dialog
        open={selectedBanUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBanUser(null);
        }}
      >
        <DialogContent>
          {selectedBanUser && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isEn ? 'Manage user ban' : 'Hallinnoi käyttäjän estoa'}
                </DialogTitle>
                <div className="w-12 h-1 bg-[#EF4444]" />
                <DialogDescription>
                  {selectedBanUser.displayName} ({selectedBanUser.email})
                </DialogDescription>
              </DialogHeader>

              {selectedBanUser.isBanned && (
                <div className="px-3.5 py-3 rounded-none bg-[#EF4444]/15 border-2 border-[#EF4444] text-xs leading-snug space-y-1">
                  <div className="font-mono font-extrabold uppercase text-[#FCA5A5]">
                    {isEn ? 'Active ban:' : 'Voimassa oleva esto:'} {formatBanUntil(selectedBanUser)}
                  </div>
                  {selectedBanUser.banReason && (
                    <div className="text-[#F4F4F5]">
                      {isEn ? 'Reason:' : 'Syy:'} {selectedBanUser.banReason}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleApplyBan} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="modal-ban-duration">
                    {isEn ? 'Ban duration' : 'Käyttöeston pituus'}
                  </Label>
                  <NativeSelect
                    id="modal-ban-duration"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    disabled={updateUserBanMutation.isPending}
                  >
                    <option value="1">{isEn ? '1 hour' : '1 tunti'}</option>
                    <option value="3">{isEn ? '3 hours' : '3 tuntia'}</option>
                    <option value="12">{isEn ? '12 hours' : '12 tuntia'}</option>
                    <option value="24">{isEn ? '24 hours, 1 day' : '1 vuorokausi, 24 h'}</option>
                    <option value="72">{isEn ? '3 days, 72 hours' : '3 päivää, 72 h'}</option>
                    <option value="168">{isEn ? '1 week, 7 days' : '1 viikko, 7 vrk'}</option>
                    <option value="336">{isEn ? '2 weeks, 14 days' : '2 viikkoa, 14 vrk'}</option>
                    <option value="720">{isEn ? '1 month, 30 days' : '1 kuukausi, 30 vrk'}</option>
                    <option value="2160">{isEn ? '3 months, 90 days' : '3 kuukautta, 90 vrk'}</option>
                    <option value="permanent">
                      {isEn ? 'Permanent ban' : 'Pysyvä esto'}
                    </option>
                  </NativeSelect>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="modal-ban-reason">
                    {isEn ? 'Reason for ban (optional)' : 'Käyttöeston syy (valinnainen)'}
                  </Label>
                  <Input
                    id="modal-ban-reason"
                    type="text"
                    placeholder={
                      isEn
                        ? 'For example rule violation or hardware misuse...'
                        : 'Esimerkiksi sääntörikkomus tai laitteiden väärinkäyttö...'
                    }
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    disabled={updateUserBanMutation.isPending}
                  />
                </div>

                <DialogFooter>
                  {selectedBanUser.isBanned && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleRemoveBan}
                      disabled={updateUserBanMutation.isPending}
                    >
                      {isEn ? 'Remove ban' : 'Poista esto'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedBanUser(null)}
                    disabled={updateUserBanMutation.isPending}
                  >
                    {isEn ? 'Cancel' : 'Peruuta'}
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={updateUserBanMutation.isPending}
                  >
                    {selectedBanUser.isBanned
                      ? isEn
                        ? 'Update ban'
                        : 'Päivitä esto'
                      : isEn
                      ? 'Apply ban'
                      : 'Aseta esto'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
