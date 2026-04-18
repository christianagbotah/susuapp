'use client';

import { useState, useMemo } from 'react';
import { useAdminExtendedStore } from '@/store/app-store';
import { formatGHS, formatDate } from '@/lib/formatters';
import { motion } from 'framer-motion';
import {
  Users, Wallet, Banknote, PlayCircle, CheckCircle, Eye,
  Search, Filter, FileText, Receipt,
  Building2, Clock, TrendingDown, TrendingUp,
  BadgeCheck, CreditCard, Landmark, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import type { PayrollRun, Payslip } from '@/lib/types';

// ---- Helpers ----
const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const payrollRunStatusColor: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  processing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const payslipStatusColor: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const contractTypeLabel: Record<string, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  probation: 'Probation',
  national_service: 'Nat. Service',
};

const employeeStatusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  on_leave: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// ---- Stagger Animation Wrapper ----
function StaggerCard({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function AdminPayroll() {
  const {
    payrollEmployees,
    payrollRuns,
    payslips,
    approvePayrollRun,
  } = useAdminExtendedStore();

  // ---- Local State ----
  const [activeTab, setActiveTab] = useState('runs');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [empStatusFilter, setEmpStatusFilter] = useState('all');
  const [payslipPeriodFilter, setPayslipPeriodFilter] = useState('all');
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [payslipsForRun, setPayslipsForRun] = useState<Payslip[]>([]);
  const [showRunPayslips, setShowRunPayslips] = useState<PayrollRun | null>(null);
  const [approveDialog, setApproveDialog] = useState<PayrollRun | null>(null);
  const [payDialog, setPayDialog] = useState<PayrollRun | null>(null);

  // ---- Derived Data ----
  const departments = useMemo(
    () => ['all', ...Array.from(new Set(payrollEmployees.map((e) => e.department))).sort()],
    [payrollEmployees]
  );

  const periods = useMemo(
    () => ['all', ...Array.from(new Set(payslips.map((p) => p.period)))],
    [payslips]
  );

  const latestRun = payrollRuns.reduce<PayrollRun | null>(
    (best, r) => {
      if (!best) return r;
      return new Date(r.createdAt) > new Date(best.createdAt) ? r : best;
    },
    null
  );

  const activePayrollRuns = payrollRuns.filter(
    (r) => r.status === 'draft' || r.status === 'processing' || r.status === 'approved'
  ).length;

  const filteredEmployees = useMemo(() => {
    return payrollEmployees.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q);
      const matchDept = deptFilter === 'all' || e.department === deptFilter;
      const matchStatus = empStatusFilter === 'all' || e.status === empStatusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [payrollEmployees, searchQuery, deptFilter, empStatusFilter]);

  const filteredPayslips = useMemo(() => {
    let result = payslips;
    if (payslipPeriodFilter !== 'all') {
      result = result.filter((p) => p.period === payslipPeriodFilter);
    }
    return result;
  }, [payslips, payslipPeriodFilter]);

  // ---- Handlers ----
  const handleApprove = () => {
    if (approveDialog) {
      approvePayrollRun(approveDialog.id);
      toast.success(`Payroll run for ${approveDialog.period} approved successfully`);
      setApproveDialog(null);
    }
  };

  const handleProcessPayment = () => {
    if (payDialog) {
      toast.success(`Payment processing initiated for ${payDialog.period}`);
      setPayDialog(null);
    }
  };

  const handleViewPayslips = (run: PayrollRun) => {
    const runPayslips = payslips.filter((p) => p.payrollRunId === run.id);
    setPayslipsForRun(runPayslips);
    setShowRunPayslips(run);
  };

  // ---- Summary Stats ----
  const summaryCards = [
    {
      label: 'Total Employees',
      value: payrollEmployees.filter((e) => e.status !== 'terminated').length.toString(),
      icon: Users,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
      sub: `${payrollEmployees.filter((e) => e.status === 'active').length} active`,
    },
    {
      label: 'Gross Pay (Latest)',
      value: formatGHS(latestRun?.totalGrossPay ?? 0),
      icon: Wallet,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      sub: latestRun?.period ?? 'N/A',
    },
    {
      label: 'Net Pay (Latest)',
      value: formatGHS(latestRun?.totalNetPay ?? 0),
      icon: Banknote,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      sub: latestRun?.period ?? 'N/A',
    },
    {
      label: 'Active Runs',
      value: activePayrollRuns.toString(),
      icon: PlayCircle,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
      sub: `${payrollRuns.filter((r) => r.status === 'paid').length} paid runs`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ===== Summary Stats Row ===== */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
        {summaryCards.map((card, i) => (
          <StaggerCard key={card.label} index={i}>
            <Card className="mobile-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-lg font-bold truncate">{card.value}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{card.sub}</p>
                </div>
              </CardContent>
            </Card>
          </StaggerCard>
        ))}
      </div>

      {/* ===== Tabs ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="runs" className="gap-1.5">
              <FileText className="h-4 w-4" /> Payroll Runs
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-1.5">
              <Users className="h-4 w-4" /> Employees
            </TabsTrigger>
            <TabsTrigger value="payslips" className="gap-1.5">
              <Receipt className="h-4 w-4" /> Payslips
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB 1: PAYROLL RUNS ===== */}
          <TabsContent value="runs" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> All Payroll Runs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto overscroll-x-contain scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Pay Date</TableHead>
                        <TableHead className="text-right">Employees</TableHead>
                        <TableHead className="text-right">Gross Pay</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                        <TableHead className="text-right">SSNIT</TableHead>
                        <TableHead className="text-right">PAYE</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollRuns.map((run) => (
                        <TableRow key={run.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{run.period}</TableCell>
                          <TableCell>{formatDate(run.payDate)}</TableCell>
                          <TableCell className="text-right">{run.totalEmployees}</TableCell>
                          <TableCell className="text-right font-medium">{formatGHS(run.totalGrossPay)}</TableCell>
                          <TableCell className="text-right font-medium">{formatGHS(run.totalNetPay)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatGHS(run.totalSSNIT)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatGHS(run.totalPAYE)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${payrollRunStatusColor[run.status] || ''}`}>
                              {run.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleViewPayslips(run)}
                              >
                                <Eye className="mr-1 h-3 w-3" /> Payslips
                              </Button>
                              {(run.status === 'draft' || run.status === 'processing') && (
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => setApproveDialog(run)}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" /> Approve
                                </Button>
                              )}
                              {run.status === 'approved' && (
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => setPayDialog(run)}
                                >
                                  <CreditCard className="mr-1 h-3 w-3" /> Pay
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y">
                  {payrollRuns.map((run) => (
                    <div key={run.id} className="mobile-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{run.period}</p>
                          <p className="text-xs text-muted-foreground">Pay Date: {formatDate(run.payDate)}</p>
                        </div>
                        <Badge variant="secondary" className={`text-xs ${payrollRunStatusColor[run.status] || ''}`}>
                          {run.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Employees:</span>{' '}
                          <span className="font-medium">{run.totalEmployees}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gross:</span>{' '}
                          <span className="font-medium">{formatGHS(run.totalGrossPay)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net:</span>{' '}
                          <span className="font-medium">{formatGHS(run.totalNetPay)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">SSNIT:</span>{' '}
                          <span className="text-muted-foreground">{formatGHS(run.totalSSNIT)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 text-xs min-h-[44px] lg:min-h-0"
                          onClick={() => handleViewPayslips(run)}
                        >
                          <Eye className="mr-1 h-3 w-3" /> View Payslips
                        </Button>
                        {(run.status === 'draft' || run.status === 'processing') && (
                          <Button
                            size="sm"
                            className="flex-1 h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] lg:min-h-0"
                            onClick={() => setApproveDialog(run)}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" /> Approve
                          </Button>
                        )}
                        {run.status === 'approved' && (
                          <Button
                            size="sm"
                            className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] lg:min-h-0"
                            onClick={() => setPayDialog(run)}
                          >
                            <CreditCard className="mr-1 h-3 w-3" /> Pay
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 2: EMPLOYEES ===== */}
          <TabsContent value="employees" className="mt-4 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-3 lg:p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search employees by name, ID, position..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Building2 className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d === 'all' ? 'All Departments' : d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={empStatusFilter} onValueChange={setEmpStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
                </p>
              </CardContent>
            </Card>

            {/* Employee Table */}
            <Card>
              <CardContent className="p-0">
                {/* Desktop */}
                <div className="hidden lg:block overflow-x-auto overscroll-x-contain scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Basic Salary</TableHead>
                        <TableHead>SSNIT No.</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                                  {getInitials(emp.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{emp.position}</TableCell>
                          <TableCell className="text-sm">{emp.department}</TableCell>
                          <TableCell className="text-right font-medium text-sm">{formatGHS(emp.basicSalary)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{emp.ssnitNumber}</TableCell>
                          <TableCell>
                            <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {contractTypeLabel[emp.contractType] || emp.contractType}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${employeeStatusColor[emp.status] || ''}`}>
                              {emp.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y">
                  {filteredEmployees.map((emp) => (
                    <div key={emp.id} className="mobile-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                              {getInitials(emp.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.employeeId} &middot; {emp.position}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-xs ${employeeStatusColor[emp.status] || ''}`}>
                          {emp.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Department:</span>{' '}
                          <span>{emp.department}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Salary:</span>{' '}
                          <span className="font-medium">{formatGHS(emp.basicSalary)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">SSNIT:</span>{' '}
                          <span className="font-mono text-xs">{emp.ssnitNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contract:</span>{' '}
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {contractTypeLabel[emp.contractType]}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 3: PAYSLIPS ===== */}
          <TabsContent value="payslips" className="mt-4 space-y-4">
            {/* Period Filter */}
            <Card>
              <CardContent className="p-3 lg:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Select value={payslipPeriodFilter} onValueChange={setPayslipPeriodFilter}>
                      <SelectTrigger className="w-full sm:w-52">
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by Period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p === 'all' ? 'All Periods' : p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredPayslips.length} payslip{filteredPayslips.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payslips Table */}
            <Card>
              <CardContent className="p-0">
                {/* Desktop */}
                <div className="hidden lg:block overflow-x-auto overscroll-x-contain scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Gross Pay</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayslips.map((ps) => (
                        <TableRow
                          key={ps.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedPayslip(ps)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700">
                                  {getInitials(ps.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{ps.employeeName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{ps.position}</TableCell>
                          <TableCell className="text-sm">{ps.period}</TableCell>
                          <TableCell className="text-right font-medium text-sm">{formatGHS(ps.grossPay)}</TableCell>
                          <TableCell className="text-right text-sm text-red-600">
                            -{formatGHS(ps.totalDeductions)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm text-emerald-600">
                            {formatGHS(ps.netPay)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${payslipStatusColor[ps.status] || ''}`}>
                              {ps.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedPayslip(ps)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y">
                  {filteredPayslips.map((ps) => (
                    <div
                      key={ps.id}
                      className="mobile-card p-4 space-y-3 cursor-pointer active:bg-muted/50 transition-colors"
                      onClick={() => setSelectedPayslip(ps)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700">
                              {getInitials(ps.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{ps.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{ps.position} &middot; {ps.period}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-xs ${payslipStatusColor[ps.status] || ''}`}>
                          {ps.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-center">
                        <div className="rounded-lg bg-muted p-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gross</p>
                          <p className="font-semibold text-sm">{formatGHS(ps.grossPay)}</p>
                        </div>
                        <div className="rounded-lg bg-muted p-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Deductions</p>
                          <p className="font-semibold text-sm text-red-600">-{formatGHS(ps.totalDeductions)}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2">
                          <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Net Pay</p>
                          <p className="font-semibold text-sm text-emerald-600">{formatGHS(ps.netPay)}</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" className="h-8 text-xs min-h-[44px] lg:min-h-0">
                          <Eye className="mr-1 h-3 w-3" /> View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ===== APPROVE PAYROLL RUN DIALOG ===== */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <BadgeCheck className="h-5 w-5" /> Approve Payroll Run
            </DialogTitle>
            <DialogDescription>Review and confirm payroll approval</DialogDescription>
          </DialogHeader>
          {approveDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{approveDialog.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pay Date</span>
                  <span>{formatDate(approveDialog.payDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employees</span>
                  <span className="font-medium">{approveDialog.totalEmployees}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Gross Pay</span>
                  <span className="font-medium">{formatGHS(approveDialog.totalGrossPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total SSNIT</span>
                  <span>{formatGHS(approveDialog.totalSSNIT)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total PAYE</span>
                  <span>{formatGHS(approveDialog.totalPAYE)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Net Pay</span>
                  <span className="font-semibold text-emerald-600">{formatGHS(approveDialog.totalNetPay)}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveDialog(null)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleApprove}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve Payroll
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== PROCESS PAYMENT DIALOG ===== */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CreditCard className="h-5 w-5" /> Process Payment
            </DialogTitle>
            <DialogDescription>Initiate salary payments for the payroll period</DialogDescription>
          </DialogHeader>
          {payDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{payDialog.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employees</span>
                  <span className="font-medium">{payDialog.totalEmployees}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-lg text-emerald-600">{formatGHS(payDialog.totalNetPay)}</span>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>This will initiate bank transfers for all {payDialog.totalEmployees} employees. Ensure sufficient funds are available.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleProcessPayment}>
                  <CreditCard className="mr-1 h-4 w-4" /> Process Payment
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== RUN PAYSLIPS DIALOG ===== */}
      <Dialog open={!!showRunPayslips} onOpenChange={() => setShowRunPayslips(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Payslips - {showRunPayslips?.period}
            </DialogTitle>
            <DialogDescription>
              {payslipsForRun.length} payslip{payslipsForRun.length !== 1 ? 's' : ''} for this payroll run
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {payslipsForRun.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No payslips generated for this period yet.</p>
              </div>
            ) : (
              payslipsForRun.map((ps) => (
                <div
                  key={ps.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedPayslip(ps);
                    setShowRunPayslips(null);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700">
                        {getInitials(ps.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{ps.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{ps.position} &middot; {ps.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatGHS(ps.netPay)}</p>
                    <Badge variant="secondary" className={`text-[10px] ${payslipStatusColor[ps.status] || ''}`}>
                      {ps.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== PAYSLIP DETAIL DIALOG ===== */}
      <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Payslip Details
            </DialogTitle>
            <DialogDescription>Detailed earnings and deductions breakdown</DialogDescription>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-5">
              {/* Employee Info Header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700">
                    {getInitials(selectedPayslip.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold">{selectedPayslip.employeeName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayslip.position} &middot; {selectedPayslip.department}</p>
                </div>
                <Badge variant="secondary" className={`text-xs ${payslipStatusColor[selectedPayslip.status] || ''}`}>
                  {selectedPayslip.status}
                </Badge>
              </div>

              {/* Period & Pay Date */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="font-medium">{selectedPayslip.period}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Pay Date</p>
                  <p className="font-medium">{formatDate(selectedPayslip.payDate)}</p>
                </div>
              </div>

              <Separator />

              {/* Earnings Breakdown */}
              <div>
                <h4 className="flex items-center gap-1.5 mb-3 text-sm font-semibold text-emerald-600">
                  <TrendingUp className="h-4 w-4" /> Earnings
                </h4>
                <div className="rounded-lg border space-y-0 divide-y">
                  {[
                    { label: 'Basic Salary', value: selectedPayslip.basicSalary },
                    { label: 'Housing Allowance', value: selectedPayslip.housingAllowance },
                    { label: 'Transport Allowance', value: selectedPayslip.transportAllowance },
                    { label: 'Other Allowances', value: selectedPayslip.otherAllowances },
                    { label: 'Overtime Pay', value: selectedPayslip.overtimePay },
                    { label: 'Bonus', value: selectedPayslip.bonus },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{formatGHS(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10">
                    <span className="font-semibold text-sm">Gross Pay</span>
                    <span className="font-bold text-emerald-600">{formatGHS(selectedPayslip.grossPay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown - Employee */}
              <div>
                <h4 className="flex items-center gap-1.5 mb-3 text-sm font-semibold text-red-600">
                  <TrendingDown className="h-4 w-4" /> Employee Deductions
                </h4>
                <div className="rounded-lg border space-y-0 divide-y">
                  {[
                    { label: 'SSNIT (5.5%)', value: selectedPayslip.ssnitEmployee },
                    { label: 'Tier 2 Pension (5%)', value: selectedPayslip.tier2Employee },
                    { label: 'PAYE Tax', value: selectedPayslip.payeTax },
                    { label: 'NHF Deduction', value: selectedPayslip.nhfDeduction },
                    { label: 'Other Deductions', value: selectedPayslip.otherDeductions },
                    { label: 'Loan Deduction', value: selectedPayslip.loanDeduction },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-red-600">-{formatGHS(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/10">
                    <span className="font-semibold text-sm">Total Deductions</span>
                    <span className="font-bold text-red-600">-{formatGHS(selectedPayslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-100">Net Pay</p>
                    <p className="text-2xl font-bold">{formatGHS(selectedPayslip.netPay)}</p>
                  </div>
                  <Banknote className="h-10 w-10 text-emerald-200" />
                </div>
              </div>

              {/* Employer Contributions */}
              <div>
                <h4 className="flex items-center gap-1.5 mb-3 text-sm font-semibold text-blue-600">
                  <Landmark className="h-4 w-4" /> Employer Contributions
                </h4>
                <div className="rounded-lg border space-y-0 divide-y">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">SSNIT Employer (13.5%)</span>
                    <span className="font-medium">{formatGHS(selectedPayslip.ssnitEmployer)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Tier 2 Employer (5%)</span>
                    <span className="font-medium">{formatGHS(selectedPayslip.tier2Employer)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/10">
                    <span className="font-semibold text-sm">Total Employer Cost</span>
                    <span className="font-bold text-blue-600">
                      {formatGHS(selectedPayslip.ssnitEmployer + selectedPayslip.tier2Employer)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Bar */}
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Payroll Summary</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Pay</span>
                  <span className="font-medium">{formatGHS(selectedPayslip.grossPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee Deductions</span>
                  <span className="font-medium text-red-600">-{formatGHS(selectedPayslip.totalDeductions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Pay</span>
                  <span className="font-bold text-emerald-600">{formatGHS(selectedPayslip.netPay)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employer Contributions</span>
                  <span className="font-medium text-blue-600">
                    {formatGHS(selectedPayslip.ssnitEmployer + selectedPayslip.tier2Employer)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost to Company</span>
                  <span className="font-bold">
                    {formatGHS(
                      selectedPayslip.grossPay +
                        selectedPayslip.ssnitEmployer +
                        selectedPayslip.tier2Employer
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
