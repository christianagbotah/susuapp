'use client';

import { useState } from 'react';
import { useAgentStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Route, Users, MapPin, Clock, ChevronDown, ChevronRight, CheckCircle,
  AlertCircle, DollarSign, UserX, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CollectionCustomer } from '@/lib/types';

interface CollectDialogState {
  open: boolean;
  routeId: string;
  customerId: string;
  customerName: string;
  expectedAmount: number;
}

interface AbsentDialogState {
  open: boolean;
  routeId: string;
  customerId: string;
  customerName: string;
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export function AgentCollections() {
  const { collectionRoutes, collectFromCustomer, markCustomerAbsent } = useAgentStore();

  const activeRoutes = collectionRoutes.filter(
    (r) => r.status === 'in_progress' || r.status === 'partial'
  );
  const completedRoutes = collectionRoutes.filter((r) => r.status === 'completed');

  const [expandedRoute, setExpandedRoute] = useState<string | null>(
    activeRoutes[0]?.id ?? null
  );

  const [collectDialog, setCollectDialog] = useState<CollectDialogState>({
    open: false, routeId: '', customerId: '', customerName: '', expectedAmount: 0,
  });
  const [collectAmount, setCollectAmount] = useState('');

  const [absentDialog, setAbsentDialog] = useState<AbsentDialogState>({
    open: false, routeId: '', customerId: '', customerName: '',
  });
  const [absentNotes, setAbsentNotes] = useState('');

  function openCollectDialog(routeId: string, customer: CollectionCustomer) {
    setCollectDialog({
      open: true,
      routeId,
      customerId: customer.customerId,
      customerName: customer.customerName,
      expectedAmount: customer.expectedAmount,
    });
    setCollectAmount(customer.expectedAmount.toString());
  }

  function handleCollect() {
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    collectFromCustomer(collectDialog.routeId, collectDialog.customerId, amount);
    toast.success(
      `Collected ${formatGHS(amount)} from ${collectDialog.customerName}`,
      { description: 'Collection recorded successfully' }
    );
    setCollectDialog((p) => ({ ...p, open: false }));
    setCollectAmount('');
  }

  function openAbsentDialog(routeId: string, customer: CollectionCustomer) {
    setAbsentDialog({
      open: true,
      routeId,
      customerId: customer.customerId,
      customerName: customer.customerName,
    });
    setAbsentNotes('');
  }

  function handleMarkAbsent() {
    if (!absentNotes.trim()) {
      toast.error('Please add a note for the absence');
      return;
    }
    markCustomerAbsent(absentDialog.routeId, absentDialog.customerId, absentNotes.trim());
    toast.success(
      `${absentDialog.customerName} marked as absent`,
      { description: absentNotes.trim() }
    );
    setAbsentDialog((p) => ({ ...p, open: false }));
    setAbsentNotes('');
  }

  function getCustomerStatusIcon(status: string) {
    switch (status) {
      case 'collected':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'absent':
        return <UserX className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-900/30">
            <Route className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Collections</h1>
            <p className="text-sm text-muted-foreground">Manage your collection routes and record contributions</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Routes ({activeRoutes.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedRoutes.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Routes */}
        <TabsContent value="active" className="space-y-4">
          {activeRoutes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
                <p className="font-medium">No active routes</p>
                <p className="text-sm">All collections have been completed for today.</p>
              </CardContent>
            </Card>
          ) : (
            activeRoutes.map((route, index) => {
              const isExpanded = expandedRoute === route.id;
              const progress =
                route.totalExpected > 0
                  ? Math.round((route.totalCollected / route.totalExpected) * 100)
                  : 0;
              const collectedCount = route.customers.filter(
                (c) => c.status === 'collected'
              ).length;

              return (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                >
                  <Card className="mobile-card overflow-hidden">
                    {/* Route Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                      className="w-full text-left touch-manipulation"
                    >
                      <CardContent className="p-3 lg:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-sm lg:text-base">{route.name}</h3>
                              <Badge className={getStatusColor(route.status)}>
                                {route.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {route.area}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatDate(route.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {collectedCount}/{route.customerCount}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {formatGHS(route.totalCollected)} / {formatGHS(route.totalExpected)}
                                </span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          </div>
                          <div className="mt-1">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </button>

                    {/* Customer List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t">
                            {/* Desktop table */}
                            <div className="hidden md:block">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Susu Group</TableHead>
                                    <TableHead className="text-right">Expected</TableHead>
                                    <TableHead className="text-right">Collected</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {route.customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                      <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                          {getCustomerStatusIcon(customer.status)}
                                          {customer.customerName}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {customer.customerPhone}
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-xs">{customer.susuGroupName}</span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatGHS(customer.expectedAmount)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {customer.collectedAmount > 0
                                          ? formatGHS(customer.collectedAmount)
                                          : '—'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={`text-[10px] ${getStatusColor(customer.status)}`}>
                                          {customer.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
                                        {customer.notes || '—'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {customer.status === 'pending' && (
                                          <div className="flex justify-end gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => openCollectDialog(route.id, customer)}
                                            >
                                              <DollarSign className="mr-1 h-3.5 w-3.5" />
                                              Collect
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="text-gray-500 hover:text-gray-700"
                                              onClick={() => openAbsentDialog(route.id, customer)}
                                            >
                                              <UserX className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                        {customer.status === 'collected' && (
                                          <CheckCircle className="ml-auto h-5 w-5 text-emerald-500" />
                                        )}
                                        {customer.status === 'absent' && (
                                          <span className="text-xs text-muted-foreground">Marked absent</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Mobile cards */}
                            <div className="space-y-3 p-3 lg:p-4 md:hidden overscroll-y-contain max-h-[60vh] overflow-y-auto">
                              {route.customers.map((customer) => (
                                <div
                                  key={customer.id}
                                  className="mobile-list-item flex items-start gap-3 rounded-lg border p-3 touch-manipulation"
                                >
                                  <div className="mt-0.5">{getCustomerStatusIcon(customer.status)}</div>
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium truncate">{customer.customerName}</p>
                                      <Badge className={`text-[10px] ${getStatusColor(customer.status)}`}>
                                        {customer.status}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{customer.customerPhone}</p>
                                    <p className="text-xs text-muted-foreground">{customer.susuGroupName}</p>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        Expected: {formatGHS(customer.expectedAmount)}
                                      </span>
                                      <span className="font-medium">
                                        Collected: {customer.collectedAmount > 0 ? formatGHS(customer.collectedAmount) : '—'}
                                      </span>
                                    </div>
                                    {customer.notes && (
                                      <p className="text-xs text-muted-foreground italic">
                                        Note: {customer.notes}
                                      </p>
                                    )}
                                    {customer.status === 'pending' && (
                                      <div className="flex gap-2 pt-1">
                                        <Button
                                          size="sm"
                                          className="haptic-feedback flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px] lg:min-h-0"
                                          onClick={() => openCollectDialog(route.id, customer)}
                                        >
                                          <DollarSign className="mr-1 h-3.5 w-3.5" />
                                          Collect
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="haptic-feedback min-h-[44px] lg:min-h-0"
                                          onClick={() => openAbsentDialog(route.id, customer)}
                                        >
                                          <UserX className="mr-1 h-3.5 w-3.5" />
                                          Absent
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Route Summary */}
                            <div className="border-t bg-muted/30 px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  <Users className="mr-1 inline h-4 w-4" />
                                  {collectedCount}/{route.customerCount} customers collected
                                </span>
                                <span className="font-medium">
                                  <DollarSign className="mr-1 inline h-4 w-4" />
                                  {formatGHS(route.totalCollected)} of {formatGHS(route.totalExpected)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        {/* Completed Routes */}
        <TabsContent value="completed" className="space-y-3">
          {completedRoutes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clock className="mx-auto mb-2 h-10 w-10" />
                <p className="font-medium">No completed routes yet</p>
                <p className="text-sm">Completed collection routes will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            completedRoutes.map((route, index) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Card className="mobile-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <h3 className="font-semibold">{route.name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {route.area}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(route.date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatGHS(route.totalCollected)} / {formatGHS(route.totalExpected)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {route.customers.filter((c) => c.status === 'collected').length}/{route.customerCount} collected
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Collect Dialog */}
      <Dialog open={collectDialog.open} onOpenChange={(open) => setCollectDialog((p) => ({ ...p, open }))}>
        <DialogContent className="mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Record Collection</DialogTitle>
            <DialogDescription>
              Enter the amount collected from {collectDialog.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-sm font-medium">{collectDialog.customerName}</p>
              <p className="text-sm text-muted-foreground">
                Expected: {formatGHS(collectDialog.expectedAmount)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collect-amount">Amount Collected (₵)</Label>
              <Input
                id="collect-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="h-12 lg:h-10"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCollectDialog((p) => ({ ...p, open: false }))}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCollect}
            >
              Confirm Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Absent Dialog */}
      <Dialog open={absentDialog.open} onOpenChange={(open) => setAbsentDialog((p) => ({ ...p, open }))}>
        <DialogContent className="mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Mark as Absent</DialogTitle>
            <DialogDescription>
              Record that {absentDialog.customerName} was not available for collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">{absentDialog.customerName}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="absent-notes">Notes (required)</Label>
              <Textarea
                id="absent-notes"
                placeholder="e.g. Customer not at stall, will come tomorrow..."
                value={absentNotes}
                onChange={(e) => setAbsentNotes(e.target.value)}
                rows={3}
                className="h-12 lg:h-auto"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAbsentDialog((p) => ({ ...p, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleMarkAbsent}
            >
              Mark Absent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
