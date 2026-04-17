'use client';

import { useState } from 'react';
import { useAdminStore } from '@/store/app-store';
import { formatDate, formatDateTime, getStatusColor } from '@/lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Eye, ChevronDown, AlertTriangle, Search,
  CheckCircle2, UserCheck, TrendingDown, FileWarning,
  RefreshCw, ArrowUpRight, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { ComplianceReport } from '@/lib/types';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

const typeColors: Record<string, string> = {
  kyc: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  aml: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  transaction_limit: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  suspicious_activity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export function AdminCompliance() {
  const { complianceReports } = useAdminStore();
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [updateReport, setUpdateReport] = useState<ComplianceReport | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [reports, setReports] = useState(complianceReports);

  const openCases = reports.filter(r => r.status === 'open').length;
  const investigating = reports.filter(r => r.status === 'investigating').length;
  const escalated = reports.filter(r => r.status === 'escalated').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  const criticalAlerts = reports.filter(r => r.severity === 'critical');
  const highAlerts = reports.filter(r => r.severity === 'high' && r.status !== 'resolved');

  const handleUpdate = () => {
    if (updateReport && updateStatus) {
      setReports(prev => prev.map(r =>
        r.id === updateReport.id ? { ...r, status: updateStatus as ComplianceReport['status'] } : r
      ));
      toast.success(`Report status updated to ${updateStatus}`);
      setUpdateReport(null);
      setUpdateStatus('');
      setUpdateNotes('');
    }
  };

  const handleAssign = (report: ComplianceReport) => {
    toast.info(`Report "${report.title}" has been assigned to Daniel Tetteh`);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
        {[
          { label: 'Open Cases', value: openCases, icon: FileWarning, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Investigating', value: investigating, icon: Search, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
          { label: 'Escalated', value: escalated, icon: ArrowUpRight, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
          { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alert Cards - Critical and High */}
      <AnimatePresence>
        {(criticalAlerts.length > 0 || highAlerts.length > 0) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="space-y-3">
              {criticalAlerts.map(report => (
                <motion.div key={report.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 rounded-lg border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3 lg:p-4 touch-manipulation">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white text-xs">CRITICAL</Badge>
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(report.status)}`}>{report.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-semibold">{report.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs border-red-300 text-red-600 hover:bg-red-50 min-h-[44px]"
                    onClick={() => setSelectedReport(report)}>
                    <Eye className="mr-1 h-3 w-3" /> View
                  </Button>
                </motion.div>
              ))}
              {highAlerts.map(report => (
                <motion.div key={report.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 rounded-lg border-2 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 p-3 lg:p-4 touch-manipulation">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <ShieldAlert className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500 text-white text-xs">HIGH</Badge>
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(report.status)}`}>{report.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-semibold">{report.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 min-h-[44px]"
                    onClick={() => setSelectedReport(report)}>
                    <Eye className="mr-1 h-3 w-3" /> View
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk Indicators */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Risk Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">2.3%</p>
                <p className="text-sm text-muted-foreground">Default Rate</p>
                <p className="text-xs text-emerald-600 mt-1">Below threshold (5%)</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">65.2%</p>
                <p className="text-sm text-muted-foreground">KYC Completion Rate</p>
                <p className="text-xs text-amber-600 mt-1">Needs improvement</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-red-600">3</p>
                <p className="text-sm text-muted-foreground">Suspicious Activities</p>
                <p className="text-xs text-red-600 mt-1">Requires attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Compliance Reports Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Compliance Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto overscroll-x-contain">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Severity</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Assigned To</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs ${typeColors[report.type] || ''}`}>
                          {report.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{report.title}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{report.description}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(report.severity)}`}>
                          {report.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(report.status)}`}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(report.date)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{report.assignedTo || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setUpdateReport(report); setUpdateStatus(report.status); setUpdateNotes(''); }}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          {!report.assignedTo && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAssign(report)}>
                              <UserCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {reports.map(report => (
                <div key={report.id} className="p-4 space-y-2 touch-manipulation">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{report.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                    </div>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${getStatusColor(report.severity)}`}>{report.severity}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={`text-xs ${typeColors[report.type] || ''}`}>{report.type.replace('_', ' ')}</Badge>
                    <Badge variant="secondary" className={`text-xs ${getStatusColor(report.status)}`}>{report.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(report.date)}</span>
                  </div>
                  {report.assignedTo && <p className="text-xs text-muted-foreground">Assigned: {report.assignedTo}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={() => setSelectedReport(report)}>
                      <Eye className="mr-1 h-3 w-3" /> Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={() => { setUpdateReport(report); setUpdateStatus(report.status); setUpdateNotes(''); }}>
                      <RefreshCw className="mr-1 h-3 w-3" /> Update
                    </Button>
                    {!report.assignedTo && (
                      <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={() => handleAssign(report)}>
                        <UserCheck className="mr-1 h-3 w-3" /> Assign
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5" /> Compliance Report
            </DialogTitle>
            <DialogDescription>Full report details</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedReport.title}</h3>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary" className={`text-xs ${typeColors[selectedReport.type] || ''}`}>
                    {selectedReport.type.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(selectedReport.severity)}`}>
                    {selectedReport.severity}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(selectedReport.date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Assigned To</span><span>{selectedReport.assignedTo || 'Unassigned'}</span></div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-1">Description</p>
                <p className="text-muted-foreground">{selectedReport.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={!!updateReport} onOpenChange={() => setUpdateReport(null)}>
        <DialogContent className="max-w-sm mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> Update Report
            </DialogTitle>
            <DialogDescription>Change status and add notes</DialogDescription>
          </DialogHeader>
          {updateReport && (
            <div className="space-y-4">
              <p className="text-sm font-medium">{updateReport.title}</p>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Add investigation notes..." value={updateNotes} onChange={e => setUpdateNotes(e.target.value)} rows={3} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateReport(null)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleUpdate}>Update</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
