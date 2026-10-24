'use client';

import { useState } from 'react';
import { useLoanOfficerStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { UserSearch, MapPin, CalendarDays, Save, Star } from 'lucide-react';
import type { LoanAppraisal, LoanApplication } from '@/lib/types';

const CRITERIA = [
  { key: 'character', label: 'Character', hint: 'Reputation, references, susu discipline' },
  { key: 'capacity', label: 'Capacity', hint: 'Cash flow vs daily susu inflows' },
  { key: 'capital', label: 'Capital', hint: 'Own investment in the business' },
  { key: 'collateral', label: 'Collateral', hint: 'Savings pledge, guarantors, assets' },
  { key: 'conditions', label: 'Conditions', hint: 'Market seasonality & business outlook' },
] as const;

type CriterionKey = typeof CRITERIA[number]['key'];

export function LoanOfficerAppraisals() {
  const { user, appraisals, applications, saveAppraisal, advanceStage } = useLoanOfficerStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<LoanApplication | null>(null);
  const [scores, setScores] = useState<Record<CriterionKey, number>>({ character: 3, capacity: 3, capital: 3, collateral: 3, conditions: 3 });
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState<LoanAppraisal['recommendation']>('approve');
  const [amount, setAmount] = useState('');

  const toAppraise = applications.filter(a => ['field_visit', 'appraisal', 'documents_pending'].includes(a.stage));

  const openFor = (app: LoanApplication) => {
    const existing = appraisals.find(v => v.applicationId === app.id);
    setActiveApp(app);
    setScores(existing ? { character: existing.character, capacity: existing.capacity, capital: existing.capital, collateral: existing.collateral, conditions: existing.conditions } : { character: 3, capacity: 3, capital: 3, collateral: 3, conditions: 3 });
    setLocation(existing?.businessLocation ?? '');
    setNotes(existing?.notes ?? '');
    setRecommendation(existing?.recommendation ?? 'approve');
    setAmount(String(existing?.recommendedAmount ?? app.amount));
    setDialogOpen(true);
  };

  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  const maxTotal = 25;
  const grade = total >= 21 ? 'A' : total >= 17 ? 'B' : total >= 13 ? 'C' : total >= 9 ? 'D' : 'E';

  const handleSave = () => {
    if (!activeApp) return;
    if (!location.trim() || !notes.trim()) {
      toast.error('Business location and field notes are required for the appraisal file.');
      return;
    }
    const recAmount = Number(amount) || activeApp.amount;
    saveAppraisal({
      id: `vcg-${activeApp.id}`,
      applicationId: activeApp.id,
      applicantName: activeApp.applicantName,
      officerName: user.name,
      ...scores,
      fieldVisitDate: '2026-10-25',
      businessLocation: location.trim(),
      notes: notes.trim(),
      recommendation,
      recommendedAmount: recAmount,
    });
    if (recommendation !== 'reject') {
      advanceStage(activeApp.id, 'recommended');
    }
    toast.success(`5C appraisal saved — ${activeApp.applicantName}`, {
      description: `Score ${total}/${maxTotal} (Grade ${grade}) · ${recommendation === 'approve' ? 'Recommended to Branch Manager' : recommendation === 'reduce_amount' ? 'Reduced amount proposed' : 'Marked for rejection'}`,
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Saved appraisals */}
      <h2 className="flex items-center gap-2 text-lg font-semibold"><UserSearch className="h-5 w-5 text-amber-500" /> Completed 5C Appraisals</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {appraisals.map((v, i) => {
          const score = v.character + v.capacity + v.capital + v.collateral + v.conditions;
          const g = score >= 21 ? 'A' : score >= 17 ? 'B' : score >= 13 ? 'C' : score >= 9 ? 'D' : 'E';
          return (
            <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card className="mobile-card h-full">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{v.applicantName}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {v.businessLocation}</p>
                    </div>
                    <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Grade {g}</Badge>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CRITERIA.map(c => (
                      <div key={c.key} className="rounded bg-muted/60 p-1.5 text-center">
                        <p className="text-[9px] font-medium text-muted-foreground">{c.label.slice(0, 3)}</p>
                        <p className="text-sm font-bold">{v[c.key]}</p>
                      </div>
                    ))}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{v.notes}</p>
                  <div className="flex items-center justify-between border-t pt-2 text-xs">
                    <span className="text-muted-foreground">{formatDate(v.fieldVisitDate)}</span>
                    <span className="font-semibold">{v.recommendation === 'approve' ? `Approve ${formatGHS(v.recommendedAmount)}` : v.recommendation === 'reduce_amount' ? `Reduce to ${formatGHS(v.recommendedAmount)}` : 'Reject'}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Pending appraisals */}
      <h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5 text-blue-500" /> Awaiting Appraisal</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {toAppraise.map(a => (
          <Card key={a.id} className="mobile-card hover:shadow-md transition-shadow">
            <CardContent className="space-y-2.5 p-4">
              <div className="flex items-center justify-between">
                <p className="truncate font-semibold">{a.applicantName}</p>
                <Badge className="text-[10px] capitalize">{a.stage.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="text-sm">{a.productName} — <span className="font-bold">{formatGHS(a.amount)}</span></p>
              <Button size="sm" className="w-full min-h-[40px] bg-amber-600 hover:bg-amber-700 touch-manipulation" onClick={() => openFor(a)}>
                <UserSearch className="mr-1.5 h-4 w-4" /> Score 5 Cs
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 5C dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>5C Appraisal — {activeApp?.applicantName}</DialogTitle>
            <DialogDescription>Score each criterion 1–5. Ghana susu applicants: weigh susu discipline under Character & Capacity.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {CRITERIA.map(c => (
              <div key={c.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.hint}</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setScores(s => ({ ...s, [c.key]: n }))}
                        className={`h-9 w-9 rounded-md border text-sm font-semibold transition-colors touch-manipulation ${scores[c.key] >= n ? 'border-amber-500 bg-amber-500 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                        aria-label={`${c.label} ${n}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-medium">Total: {total}/{maxTotal} — Grade {grade}</p>
              </div>
              <Badge className={grade === 'A' || grade === 'B' ? 'bg-emerald-600' : grade === 'C' ? 'bg-amber-600' : 'bg-red-600'}>{grade}</Badge>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Business location (from field visit)</label>
              <Input placeholder="e.g. Makola Market — Fabric Line C, Stall 22" value={location} onChange={e => setLocation(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Recommendation</label>
                <Select value={recommendation} onValueChange={v => setRecommendation(v as LoanAppraisal['recommendation'])}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reduce_amount">Reduce amount</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Recommended amount (₵)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="min-h-[44px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Field visit notes</label>
              <Textarea rows={3} placeholder="Stock observed, guarantors met, cash-count results..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="min-h-[44px] bg-amber-600 hover:bg-amber-700 touch-manipulation" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Appraisal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
