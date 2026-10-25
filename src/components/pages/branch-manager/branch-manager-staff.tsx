'use client';

import { useState } from 'react';
import { useBranchManagerStore } from '@/store/staff-stores';
import { formatDate, getInitials } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, Phone, Mail, ShieldCheck, ShieldOff, Coffee, Users } from 'lucide-react';
import type { StaffMember } from '@/lib/types';

export function BranchManagerStaff() {
  const { staff, updateStaffStatus } = useBranchManagerStore();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [confirmDialog, askConfirm] = useConfirm();

  const filtered = staff.filter(m => {
    const matchesQuery = `${m.name} ${m.role} ${m.branch}`.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const roles = Array.from(new Set(staff.map(s => s.role)));

  const applyStatus = (member: StaffMember, status: StaffMember['status']) => {
    updateStaffStatus(member.id, status);
    setSelected(null);
    toast.success(`${member.name} marked as ${status.replace('_', ' ')}`, {
      description: 'Staff record updated and synced to HR.',
    });
  };

  const handleStatus = (member: StaffMember, status: StaffMember['status']) => {
    if (status === 'suspended') {
      askConfirm({
        title: 'Suspend Staff Member',
        description: 'This staff member will immediately lose platform access and be removed from active duty rosters. HR and the branch manager will be notified for the record.',
        subject: member.name,
        details: [
          { label: 'Role', value: member.role },
          { label: 'Branch', value: member.branch },
        ],
        confirmLabel: 'Yes, Suspend',
        variant: 'destructive',
        requireReason: true,
        reasonPlaceholder: 'Reason for suspension (recorded for HR)',
        onConfirm: () => applyStatus(member, status),
      });
      return;
    }
    applyStatus(member, status);
  };

  const statusBadge = (status: StaffMember['status']) =>
    status === 'active'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : status === 'on_leave'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';

  return (
    <div className="space-y-5">
      {confirmDialog}
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search staff by name, role or branch..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 min-h-[44px]" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48 min-h-[44px]"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="shrink-0 self-start sm:self-auto">{filtered.length} staff</Badge>
      </div>

      {/* Staff list */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <Card className="mobile-card cursor-pointer hover:shadow-md transition-shadow touch-manipulation" onClick={() => setSelected(m)}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback className={`${m.avatarColor} text-sm font-bold text-white`}>{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.role} · {m.branch}</p>
                  </div>
                  <Badge className={`shrink-0 text-[10px] capitalize ${statusBadge(m.status)}`}>{m.status.replace('_', ' ')}</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Performance score</span>
                    <span className={`font-semibold ${m.performance >= 85 ? 'text-emerald-600 dark:text-emerald-400' : m.performance >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{m.performance}%</span>
                  </div>
                  <Progress value={m.performance} className="h-1.5" />
                </div>
                {m.pendingApprovals ? (
                  <p className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> {m.pendingApprovals} item(s) pending their review
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Joined {formatDate(m.joinedDate)}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-muted-foreground">
              <Users className="h-10 w-10 opacity-40" />
              <p className="text-sm">No staff match your search.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`${selected.avatarColor} text-sm font-bold text-white`}>{getInitials(selected.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selected.name}</p>
                    <p className="text-xs font-normal text-muted-foreground">{selected.role} · {selected.branch}</p>
                  </div>
                </DialogTitle>
                <DialogDescription>Staff record & portal permissions overview</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2 rounded-lg border p-3 text-sm">
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selected.phone}</p>
                  <p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" /> {selected.email}</p>
                  <p className="text-xs text-muted-foreground">Joined: {formatDate(selected.joinedDate)} · Performance: {selected.performance}%</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Performance</p>
                  <Progress value={selected.performance} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="min-h-[44px] touch-manipulation" onClick={() => handleStatus(selected, 'active')} disabled={selected.status === 'active'}>
                    <ShieldCheck className="mr-1 h-4 w-4 text-emerald-500" /> Active
                  </Button>
                  <Button variant="outline" className="min-h-[44px] touch-manipulation" onClick={() => handleStatus(selected, 'on_leave')} disabled={selected.status === 'on_leave'}>
                    <Coffee className="mr-1 h-4 w-4 text-amber-500" /> Leave
                  </Button>
                  <Button variant="outline" className="min-h-[44px] border-red-200 touch-manipulation hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleStatus(selected, 'suspended')} disabled={selected.status === 'suspended'}>
                    <ShieldOff className="mr-1 h-4 w-4 text-red-500" /> Suspend
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
