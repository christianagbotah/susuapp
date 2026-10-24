'use client';

import { useState } from 'react';
import { useLoanOfficerStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ClipboardList, Phone, ArrowRight, CheckCircle2, Search } from 'lucide-react';
import type { LoanApplication, LoanOfficerPageId } from '@/lib/types';

const STAGE_FLOW: LoanApplication['stage'][] = ['new', 'documents_pending', 'field_visit', 'appraisal', 'recommended'];

const stageBadge = (stage: LoanApplication['stage']) => ({
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  documents_pending: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  field_visit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  appraisal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  recommended: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  approved: 'bg-emerald-600 text-white',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  disbursed: 'bg-teal-600 text-white',
}[stage]);

export function LoanOfficerPipeline() {
  const { applications, advanceStage, setActivePage } = useLoanOfficerStore();
  const [filter, setFilter] = useState('active');
  const [query, setQuery] = useState('');
  const [advanceOpen, setAdvanceOpen] = useState<LoanApplication | null>(null);
  const [nextStage, setNextStage] = useState<LoanApplication['stage']>('field_visit');
  const [visitNotes, setVisitNotes] = useState('');

  const filtered = applications.filter(a => {
    const matchesFilter = filter === 'all' || (filter === 'active' ? !['disbursed', 'rejected'].includes(a.stage) : a.stage === filter);
    const matchesQuery = `${a.applicantName} ${a.productName} ${a.phone}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const handleAdvance = () => {
    if (!advanceOpen) return;
    advanceStage(advanceOpen.id, nextStage);
    toast.success(`${advanceOpen.applicantName} moved to "${nextStage.replace(/_/g, ' ')}"`, {
      description: nextStage === 'field_visit'
        ? 'Field visit added to your route. Customer notified by SMS.'
        : 'Pipeline updated; next reviewer notified.',
    });
    setAdvanceOpen(null);
    setVisitNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search applicants, products or phone..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 min-h-[44px]" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-52 min-h-[44px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active pipeline</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="documents_pending">Documents pending</SelectItem>
            <SelectItem value="field_visit">Field visit</SelectItem>
            <SelectItem value="appraisal">Appraisal</SelectItem>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="disbursed">Disbursed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="shrink-0 self-start sm:self-auto">{filtered.length} applications</Badge>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((a, i) => {
          const stageIdx = STAGE_FLOW.indexOf(a.stage);
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card className="mobile-card h-full hover:shadow-md transition-shadow">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{a.applicantName}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.phone}</p>
                    </div>
                    <Badge className={`shrink-0 text-[10px] capitalize ${stageBadge(a.stage)}`}>{a.stage.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="truncate text-muted-foreground">{a.productName}</span>
                      <span className="font-bold">{formatGHS(a.amount)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{a.purpose}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Applied {formatDate(a.submittedDate)}</span>
                    {a.dailyRate ? <span className="font-medium text-emerald-600 dark:text-emerald-400">Susu ₵{a.dailyRate}/day</span> : null}
                  </div>
                  {/* stage dots */}
                  <div className="flex items-center gap-1">
                    {STAGE_FLOW.map((s, idx) => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full ${stageIdx >= idx && stageIdx >= 0 ? 'bg-amber-500' : 'bg-muted'}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="min-h-[40px] touch-manipulation" onClick={() => { setAdvanceOpen(a); setNextStage(STAGE_FLOW[Math.min(stageIdx + 1, STAGE_FLOW.length - 1)] ?? 'field_visit'); }}>
                      Advance <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="min-h-[40px] touch-manipulation" onClick={() => setActivePage('appraisals')}>
                      Appraise
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Advance dialog */}
      <Dialog open={!!advanceOpen} onOpenChange={(open) => !open && setAdvanceOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Advance Application</DialogTitle>
            <DialogDescription>{advanceOpen?.applicantName} — {advanceOpen?.productName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Move to stage</label>
              <Select value={nextStage} onValueChange={v => setNextStage(v as LoanApplication['stage'])}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_FLOW.concat(['approved', 'rejected']).map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea rows={3} placeholder="e.g. Guarantor confirmed by phone; utility bill received..." value={visitNotes} onChange={e => setVisitNotes(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              <Phone className="h-4 w-4 shrink-0" /> Applicant gets an SMS at every stage change.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setAdvanceOpen(null)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={handleAdvance}><CheckCircle2 className="mr-2 h-4 w-4" /> Advance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
