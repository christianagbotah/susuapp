'use client';

import { useState } from 'react';
import { useAccountantStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Undo2, Check, Search } from 'lucide-react';
import type { LedgerEntry } from '@/lib/types';

export function AccountantLedger() {
  const { ledger, coa, postEntry, reverseEntry } = useAccountantStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<LedgerEntry | null>(null);
  const [form, setForm] = useState({ accountCode: '', debit: '', credit: '', narration: '', reference: '' });

  const filtered = ledger.filter(l =>
    `${l.reference} ${l.accountName} ${l.accountCode} ${l.narration}`.toLowerCase().includes(query.toLowerCase())
  );

  const totalDebit = ledger.filter(l => l.status !== 'reversed').reduce((s, l) => s + l.debit, 0);
  const totalCredit = ledger.filter(l => l.status !== 'reversed').reduce((s, l) => s + l.credit, 0);
  const balanced = totalDebit === totalCredit;

  const handlePost = () => {
    const account = coa.find(a => a.code === form.accountCode);
    if (!account) { toast.error('Select an account to post to.'); return; }
    const debit = Number(form.debit) || 0;
    const credit = Number(form.credit) || 0;
    if (debit === 0 && credit === 0) { toast.error('Enter a debit or credit amount.'); return; }
    if (debit > 0 && credit > 0) { toast.error('Post either a debit OR a credit — not both in one line.'); return; }
    postEntry({
      reference: form.reference.trim() || `JV-${1043 + ledger.length}`,
      accountCode: account.code,
      accountName: account.name,
      debit,
      credit,
      narration: form.narration.trim() || 'Manual journal entry',
    });
    toast.success('Journal entry posted', { description: `${account.name} — ${debit > 0 ? `Dr ${formatGHS(debit)}` : `Cr ${formatGHS(credit)}`} · reference ${form.reference.trim() || `JV-${1043 + ledger.length}`}` });
    setOpen(false);
    setForm({ accountCode: '', debit: '', credit: '', narration: '', reference: '' });
  };

  const statusBadge = (s: LedgerEntry['status']) => ({
    posted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    reversed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }[s]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search entries by reference, account or narration..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 min-h-[44px]" />
        </div>
        <Button className="min-h-[44px] touch-manipulation" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Post Journal Entry
        </Button>
      </div>

      {/* Trial balance check */}
      <Card className={`border-l-4 ${balanced ? 'border-emerald-500' : 'border-red-500'}`}>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className={`h-8 w-8 ${balanced ? 'text-emerald-500' : 'text-red-500'}`} />
            <div>
              <p className="text-sm font-semibold">{balanced ? 'Ledger is balanced' : 'Ledger out of balance'}</p>
              <p className="text-xs text-muted-foreground">Dr {formatGHS(totalDebit)} · Cr {formatGHS(totalCredit)}</p>
            </div>
          </div>
          <Badge className={statusBadge(balanced ? 'posted' : 'draft')}>{balanced ? 'Debits = Credits' : 'Investigate difference'}</Badge>
        </CardContent>
      </Card>

      {/* Entries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Journal Entries — October 2026</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Ref</th>
                  <th className="px-4 py-2.5 font-medium">Account</th>
                  <th className="px-4 py-2.5 text-right font-medium">Debit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Credit</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(l => (
                  <tr
                    key={l.id}
                    onClick={() => setDetail(l)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(l); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View journal entry ${l.reference}`}
                    className={`cursor-pointer border-b transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${l.status === 'reversed' ? 'opacity-50' : ''}`}
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{formatDate(l.date)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{l.reference}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{l.accountName}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.narration}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold">{l.debit > 0 ? formatGHS(l.debit) : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold">{l.credit > 0 ? formatGHS(l.credit) : '—'}</td>
                    <td className="px-4 py-2.5"><Badge className={`text-[10px] capitalize ${statusBadge(l.status)}`}>{l.status}</Badge></td>
                    <td className="px-4 py-2.5 text-right">
                      {l.status === 'posted' && (
                        <Button size="sm" variant="ghost" className="h-8 min-h-0 text-xs text-red-600 touch-manipulation" onClick={(e) => { e.stopPropagation(); reverseEntry(l.id); toast.info(`Entry ${l.reference} reversed — reversal journal created.`); }}>
                          <Undo2 className="mr-1 h-3.5 w-3.5" /> Reverse
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 p-3 md:hidden">
            {filtered.map(l => (
              <div
                key={l.id}
                onClick={() => setDetail(l)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(l); } }}
                role="button"
                tabIndex={0}
                aria-label={`View journal entry ${l.reference}`}
                className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${l.status === 'reversed' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{l.accountName}</p>
                  <Badge className={`text-[10px] capitalize ${statusBadge(l.status)}`}>{l.status}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.reference} · {formatDate(l.date)} · {l.narration}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold">{l.debit > 0 ? `Dr ${formatGHS(l.debit)}` : `Cr ${formatGHS(l.credit)}`}</span>
                  {l.status === 'posted' && (
                    <Button size="sm" variant="ghost" className="h-8 min-h-0 text-xs text-red-600" onClick={(e) => { e.stopPropagation(); reverseEntry(l.id); toast.info(`Entry ${l.reference} reversed.`); }}>
                      Reverse
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Post entry dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post Journal Entry</DialogTitle>
            <DialogDescription>Double-entry posting to the chart of accounts. Accountant authority: ledger.post.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input placeholder="JV-1050" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label>Account</Label>
                <Select value={form.accountCode} onValueChange={v => setForm(f => ({ ...f, accountCode: v }))}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {coa.map(a => <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Debit (₵)</Label>
                <Input type="number" placeholder="0.00" value={form.debit} onChange={e => setForm(f => ({ ...f, debit: e.target.value, credit: '' }))} className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label>Credit (₵)</Label>
                <Input type="number" placeholder="0.00" value={form.credit} onChange={e => setForm(f => ({ ...f, credit: e.target.value, debit: '' }))} className="min-h-[44px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Narration</Label>
              <Input placeholder="e.g. MoMo float transfer to GCB operation account" value={form.narration} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))} className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={handlePost}><Check className="mr-2 h-4 w-4" /> Post Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Journal Entry Detail</DialogTitle>
            <DialogDescription>General ledger posting — {detail?.reference}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <BookOpen className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-lg font-semibold">{detail.reference}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <Badge className={`text-[10px] capitalize ${statusBadge(detail.status)}`}>{detail.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(detail.date)}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Account</p>
                  <p className="truncate text-sm font-medium">{detail.accountName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{detail.accountCode}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Posted by</p>
                  <p className="truncate text-sm font-medium">{detail.postedBy}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(detail.date)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Debit (₵)</p>
                  <p className="text-sm font-bold">{detail.debit > 0 ? formatGHS(detail.debit) : '—'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Credit (₵)</p>
                  <p className="text-sm font-bold">{detail.credit > 0 ? formatGHS(detail.credit) : '—'}</p>
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Narration</p>
                <p className="text-sm">{detail.narration}</p>
              </div>
              {detail.status === 'posted' && (
                <Button variant="outline" className="w-full min-h-[40px] text-red-600 touch-manipulation" onClick={() => { reverseEntry(detail.id); toast.info(`Entry ${detail.reference} reversed — reversal journal created.`); setDetail(null); }}>
                  <Undo2 className="mr-2 h-4 w-4" /> Reverse Entry
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
