'use client';

import { useState } from 'react';
import { useBranchManagerStore } from '@/store/staff-stores';
import { formatGHS } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Plus, Trophy, CircleDollarSign, Users, Percent } from 'lucide-react';
import type { BranchTarget } from '@/lib/types';

export function BranchManagerTargets() {
  const { targets, addTarget } = useBranchManagerStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ metric: '', target: '', owner: '', period: 'October 2026' as BranchTarget['period'], unit: 'currency' as BranchTarget['unit'] });

  const overall = Math.round(
    targets.reduce((s, t) => s + Math.min(100, t.unit === 'percent' ? (t.target >= t.achieved ? (t.target / Math.max(t.achieved, 0.01)) * 100 : 100) : (t.achieved / Math.max(t.target, 1)) * 100), 0) / targets.length
  );

  const iconFor = (metric: string) => {
    if (metric.toLowerCase().includes('collection') || metric.toLowerCase().includes('disbursement')) return CircleDollarSign;
    if (metric.toLowerCase().includes('account') || metric.toLowerCase().includes('formation')) return Users;
    if (metric.toLowerCase().includes('par') || metric.toLowerCase().includes('ratio') || metric.toLowerCase().includes('retention') || metric.toLowerCase().includes('kyc')) return Percent;
    return Target;
  };

  const handleSubmit = () => {
    if (!form.metric.trim() || !form.target || !form.owner.trim()) {
      toast.error('Fill in metric, target value and owner.');
      return;
    }
    addTarget({
      metric: form.metric.trim(),
      period: form.period,
      target: Number(form.target),
      achieved: 0,
      unit: form.unit,
      owner: form.owner.trim(),
    });
    toast.success('Target created and assigned', { description: `${form.owner} will see this on their dashboard.` });
    setOpen(false);
    setForm({ metric: '', target: '', owner: '', period: 'October 2026', unit: 'currency' });
  };

  return (
    <div className="space-y-5">
      {/* Overall performance */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                <Trophy className="h-8 w-8 text-amber-300" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Overall target attainment</p>
                <p className="text-4xl font-bold">{overall}%</p>
              </div>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 min-h-[44px] touch-manipulation" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Set New Target
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Targets grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {targets.map((t, i) => {
          const pct = t.unit === 'percent'
            ? Math.min(100, Math.round((t.target / Math.max(t.achieved, 0.01)) * 100))
            : Math.min(100, Math.round((t.achieved / Math.max(t.target, 1)) * 100));
          const onTrack = t.unit === 'percent' ? t.achieved <= t.target : pct >= 75;
          const Icon = iconFor(t.metric);
          const fmt = (v: number) => t.unit === 'currency' ? formatGHS(v) : t.unit === 'percent' ? `${v}%` : `${v}`;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card className="mobile-card h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between text-sm font-semibold">
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" /> {t.metric}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{t.period}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">{fmt(t.achieved)}</p>
                      <p className="text-xs text-muted-foreground">of {fmt(t.target)} target</p>
                    </div>
                    <Badge className={onTrack ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}>
                      {onTrack ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {t.unit === 'percent' ? 'within limit' : `${pct}%`}
                    </Badge>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={`h-full rounded-full ${onTrack ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Owner: <span className="font-medium text-foreground">{t.owner}</span></p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* New target dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Branch Target</DialogTitle>
            <DialogDescription>Assign a measurable goal to a team or staff member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Metric</Label>
              <Input placeholder="e.g. MoMo Collection Value" value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} className="min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target Value</Label>
                <Input type="number" placeholder="e.g. 350000" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v as BranchTarget['unit'] }))}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="currency">Cedis (₵)</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Select value={form.period} onValueChange={v => setForm(f => ({ ...f, period: v as BranchTarget['period'] }))}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="October 2026">October 2026</SelectItem>
                    <SelectItem value="Q4 2026">Q4 2026</SelectItem>
                    <SelectItem value="FY 2026">FY 2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Input placeholder="e.g. Loan Officers" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} className="min-h-[44px]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={handleSubmit}><Target className="mr-2 h-4 w-4" /> Create Target</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
