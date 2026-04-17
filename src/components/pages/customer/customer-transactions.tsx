'use client';

import { useState, useMemo } from 'react';
import { useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, PiggyBank, Gift, Landmark, CreditCard, BadgeDollarSign, Receipt, Search, Download, Filter, Calendar } from 'lucide-react';
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
  const { transactions } = useCustomerStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

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
    toast.success('Transaction export started', {
      description: 'Your CSV file will be ready for download shortly.',
    });
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain flex-nowrap">
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
                    <TableRow key={txn.id} className="group">
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
              <Card key={txn.id}>
                <CardContent className="p-4">
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
    </div>
  );
}
