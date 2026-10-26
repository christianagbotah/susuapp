'use client';

import { useState, useMemo } from 'react';
import { useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/formatters';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, PiggyBank, Gift, Landmark, CreditCard, BadgeDollarSign, Receipt, Download, Filter, Calendar, ShieldAlert } from 'lucide-react';
import { MobileSearchBar } from '@/components/shared/mobile-components';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

const creditTypes = ['deposit', 'susu_payout', 'loan_disbursement', 'agent_commission'];

function getTransactionTypeInfo(type: string) {
  switch (type) {
    case 'deposit':
      return { icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', label: 'Deposit' };
    case 'withdrawal':
      return { icon: ArrowUpRight, color: 'text-red-600 bg-red-100 dark:bg-red-900/30', label: 'Withdrawal' };
    case 'transfer':
      return { icon: ArrowLeftRight, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', label: 'Transfer' };
    case 'susu_contribution':
      return { icon: PiggyBank, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', label: 'Susu Contribution' };
    case 'susu_payout':
      return { icon: Gift, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', label: 'Susu Payout' };
    case 'loan_disbursement':
      return { icon: Landmark, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', label: 'Loan Disbursement' };
    case 'loan_repayment':
      return { icon: CreditCard, color: 'text-red-600 bg-red-100 dark:bg-red-900/30', label: 'Loan Repayment' };
    case 'agent_commission':
      return { icon: BadgeDollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', label: 'Commission' };
    case 'fee':
      return { icon: Receipt, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30', label: 'Fee' };
    default:
      return { icon: Receipt, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30', label: type };
  }
}

export function CustomerTransactions() {
  const { transactions, disputes, fileDispute } = useCustomerStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Detail dialog state (card → detail linkage) ----
  const [detailTxn, setDetailTxn] = useState<Transaction | null>(null);
  const [disputeType, setDisputeType] = useState('other');

  const filtered = useMemo(() => {
    return transactions.filter((txn) => {
      if (search) {
        const q = search.toLowerCase();
        const matchSearch =
          txn.description.toLowerCase().includes(q) ||
          txn.reference.toLowerCase().includes(q) ||
          txn.type.toLowerCase().includes(q) ||
          txn.category.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      if (typeFilter !== 'all' && txn.type !== typeFilter) return false;
      if (statusFilter !== 'all' && txn.status !== statusFilter) return false;
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const handleExport = () => {
    // Build a real CSV from the currently filtered transactions and trigger a download
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = [
      'Date', 'Type', 'Description', 'Category', 'Counterpart',
      'Amount (GHS)', 'Status', 'Reference', 'Balance After (GHS)',
    ];
    const rows = filtered.map((txn) => [
      txn.date,
      txn.type,
      txn.description,
      txn.category,
      txn.counterpartName ?? '',
      txn.amount.toFixed(2),
      txn.status,
      txn.reference,
      txn.balanceAfter.toFixed(2),
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${rows.length} transaction${rows.length !== 1 ? 's' : ''}`, {
      description: 'transactions.csv has been downloaded.',
    });
  };

  const openDetail = (txn: Transaction) => {
    setDisputeType('other');
    setDetailTxn(txn);
  };

  const handleFileDispute = () => {
    if (!detailTxn) return;
    fileDispute(
      detailTxn.id,
      disputeType,
      `${disputeType.replace('_', ' ')} — ${detailTxn.description} (${formatGHS(detailTxn.amount)})`,
    );
    toast.success('Dispute filed successfully', {
      description: `Our team will review transaction ${detailTxn.reference} and get back to you.`,
    });
    setDetailTxn(null);
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = search !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground text-sm">
            View and manage your transaction history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="w-fit gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 sm:flex-initial">
              <div className="hidden sm:block relative flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <MobileSearchBar
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Search transactions..."
                onCancel={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="sm:hidden"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain flex-nowrap scrollbar-hide">
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="susu_contribution">Susu Contribution</SelectItem>
                  <SelectItem value="susu_payout">Susu Payout</SelectItem>
                  <SelectItem value="loan_repayment">Loan Payment</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing{' '}
          <span className="font-medium text-foreground">
            {Math.min((safeCurrentPage - 1) * PAGE_SIZE + 1, filtered.length)}
          </span>
          {' – '}
          <span className="font-medium text-foreground">
            {Math.min(safeCurrentPage * PAGE_SIZE, filtered.length)}
          </span>
          {' of '}
          <span className="font-medium text-foreground">{filtered.length}</span>{' '}
          transactions
        </span>
        {hasActiveFilters && (
          <span className="hidden sm:inline">
            (filtered from {transactions.length} total)
          </span>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto overscroll-contain">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[140px]">Type</TableHead>
                <TableHead className="w-[100px]">Category</TableHead>
                <TableHead className="text-right w-[120px]">Amount</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[130px]">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Receipt className="h-10 w-10" />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm">
                        {hasActiveFilters
                          ? 'Try adjusting your search or filter criteria.'
                          : 'You have no transactions yet.'}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((txn) => {
                  const typeInfo = getTransactionTypeInfo(txn.type);
                  const Icon = typeInfo.icon;
                  const isCredit = creditTypes.includes(txn.type);

                  return (
                    <TableRow
                      key={txn.id}
                      onClick={() => openDetail(txn)}
                      className="group cursor-pointer border-b hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateTime(txn.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{txn.description}</span>
                          {txn.counterpartName && (
                            <span className="text-xs text-muted-foreground">
                              {txn.counterpartName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center rounded-md p-1.5 ${typeInfo.color}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-sm whitespace-nowrap">{typeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {txn.category}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${
                          isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}{formatGHS(txn.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs capitalize ${getStatusColor(txn.status)}`}
                        >
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {txn.reference.slice(0, 12)}…
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Receipt className="h-10 w-10" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You have no transactions yet.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          paginated.map((txn) => {
            const typeInfo = getTransactionTypeInfo(txn.type);
            const Icon = typeInfo.icon;
            const isCredit = creditTypes.includes(txn.type);

            return (
              <Card
                key={txn.id}
                onClick={() => openDetail(txn)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDetail(txn);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Open transaction details"
                className="mobile-card cursor-pointer transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CardContent className="p-4 mobile-list-item">
                  <div className="flex items-start gap-3 min-h-[60px]">
                    <span
                      className={`mt-0.5 inline-flex items-center justify-center rounded-lg p-2 ${typeInfo.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{txn.description}</p>
                        <span
                          className={`font-semibold tabular-nums whitespace-nowrap ${
                            isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{formatGHS(txn.amount)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{typeInfo.label}</span>
                        <span>•</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize px-1.5 py-0 ${getStatusColor(txn.status)}`}
                        >
                          {txn.status}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {txn.category}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDateTime(txn.date)}</span>
                        <span className="font-mono">{txn.reference.slice(0, 12)}…</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {safeCurrentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="min-w-[44px] min-h-[44px]"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="min-w-[44px] min-h-[44px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={!!detailTxn} onOpenChange={() => setDetailTxn(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Receipt and dispute options for this transaction</DialogDescription>
          </DialogHeader>
          {detailTxn && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 text-emerald-700">
                    {getInitials(detailTxn.counterpartName || detailTxn.description)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{detailTxn.description}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs capitalize ${getStatusColor(detailTxn.status)}`}
                    >
                      {detailTxn.status}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getTransactionTypeInfo(detailTxn.type).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</p>
                <p
                  className={`text-2xl font-bold ${
                    creditTypes.includes(detailTxn.type)
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {creditTypes.includes(detailTxn.type) ? '+' : '-'}{formatGHS(detailTxn.amount)}
                </p>
              </div>

              {/* All fields */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDateTime(detailTxn.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance After</p>
                  <p className="font-medium">{formatGHS(detailTxn.balanceAfter)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{detailTxn.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{getTransactionTypeInfo(detailTxn.type).label}</p>
                </div>
                {detailTxn.counterpartName && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Counterpart</p>
                    <p className="font-medium">{detailTxn.counterpartName}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Reference</p>
                  <p className="break-all font-mono text-xs">{detailTxn.reference}</p>
                </div>
              </div>

              {/* Dispute flow — debit transactions that completed or failed */}
              {!creditTypes.includes(detailTxn.type) &&
                (detailTxn.status === 'completed' || detailTxn.status === 'failed') &&
                !disputes.some((d) => d.transactionId === detailTxn.id) && (
                  <div className="space-y-2.5 rounded-lg border p-3">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Something wrong with this transaction?
                    </p>
                    <Select value={disputeType} onValueChange={setDisputeType}>
                      <SelectTrigger className="h-10" aria-label="Dispute type">
                        <SelectValue placeholder="Select dispute type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unauthorized">Unauthorized transaction</SelectItem>
                        <SelectItem value="duplicate">Duplicate charge</SelectItem>
                        <SelectItem value="incorrect_amount">Incorrect amount</SelectItem>
                        <SelectItem value="not_received">Not received</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="w-full gap-2" onClick={handleFileDispute}>
                      <ShieldAlert className="h-4 w-4" />
                      File Dispute
                    </Button>
                  </div>
                )}
              {disputes.some((d) => d.transactionId === detailTxn.id) && (
                <p className="text-xs text-muted-foreground">
                  A dispute has already been filed for this transaction. Our team will contact you.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
