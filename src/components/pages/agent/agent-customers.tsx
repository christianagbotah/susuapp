'use client';

import { useState } from 'react';
import { useAgentStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, Search, Phone, Bell, Eye, MapPin, CalendarDays, Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType } from '@/lib/types';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const mockTransactions = [
  { id: 'mt-1', date: '2026-04-18', desc: 'Daily contribution - Makola Market Women', amount: 500, status: 'completed' },
  { id: 'mt-2', date: '2026-04-17', desc: 'Daily contribution - Makola Market Women', amount: 500, status: 'completed' },
  { id: 'mt-3', date: '2026-04-14', desc: 'Weekly contribution - Kaneshie Traders Union', amount: 3000, status: 'completed' },
  { id: 'mt-4', date: '2026-04-16', desc: 'Loan repayment - Business Loan', amount: 1350, status: 'completed' },
  { id: 'mt-5', date: '2026-04-18', desc: 'Deposit via MTN MoMo', amount: 2000, status: 'pending' },
];

const mockSusuGroups = [
  { name: 'Makola Market Women', role: 'Member', amount: 500, frequency: 'Daily' },
  { name: 'Kaneshie Traders Union', role: 'Member', amount: 3000, frequency: 'Weekly' },
];

const kycColors: Record<string, string> = {
  full: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  basic: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  none: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function AgentCustomers() {
  const { allCustomers } = useAgentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<UserType | null>(null);

  const filteredCustomers = allCustomers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q);
    const matchesKyc = kycFilter === 'all' || c.kycLevel === kycFilter;
    return matchesSearch && matchesKyc;
  });

  const activeCount = allCustomers.length;
  const newThisMonth = allCustomers.filter((c) => {
    const d = new Date(c.memberSince);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const statsCards = [
    {
      title: 'Total Customers',
      value: allCustomers.length.toString(),
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Active',
      value: activeCount.toString(),
      icon: UserPlus,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'New This Month',
      value: newThisMonth.toString(),
      icon: CalendarDays,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  function handleCall(customer: UserType) {
    toast.success(`Calling ${customer.name}`, {
      description: `Dialing ${customer.phone}...`,
    });
  }

  function handleSendReminder(customer: UserType) {
    toast.success(`Reminder sent to ${customer.name}`, {
      description: 'SMS payment reminder has been sent.',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your assigned customers and view their profiles
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 sm:grid-cols-3">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.1 }}
          >
            <Card className="mobile-card touch-manipulation">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5 lg:space-y-1 min-w-0">
                    <p className="text-xs lg:text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-xl font-bold lg:text-2xl">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-2 lg:p-3 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 lg:h-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain scrollbar-hide">
                {(['all', 'full', 'basic', 'none'] as const).map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={kycFilter === level ? 'default' : 'outline'}
                    className="min-h-[44px] shrink-0"
                    onClick={() => setKycFilter(level)}
                  >
                    {level === 'all' ? 'All' : level === 'full' ? 'Full KYC' : level === 'basic' ? 'Basic' : 'No KYC'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer List - Desktop Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>KYC Level</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No customers found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900/30 dark:text-emerald-400">
                              {getInitials(customer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.location || '—'}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${kycColors[customer.kycLevel]}`}>
                          {customer.kycLevel === 'full' ? 'Full' : customer.kycLevel === 'basic' ? 'Basic' : 'None'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(customer.memberSince)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCall(customer)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendReminder(customer)}
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden">
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">No customers found</p>
                <p className="text-sm">Try adjusting your search or filter.</p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <Card className="mobile-card hover:shadow-sm transition-shadow touch-manipulation">
                  <CardContent className="p-3 lg:p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{customer.name}</p>
                          <Badge className={`text-[10px] ${kycColors[customer.kycLevel]}`}>
                            {customer.kycLevel === 'full' ? 'Full' : customer.kycLevel === 'basic' ? 'Basic' : 'None'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                          {customer.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {customer.location}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Member since {formatDate(customer.memberSince)}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-h-[44px] lg:min-h-0"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] lg:min-h-0"
                            onClick={() => handleCall(customer)}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] lg:min-h-0"
                            onClick={() => handleSendReminder(customer)}
                          >
                            <Bell className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>Customer Profile</DialogTitle>
                <DialogDescription>View full customer details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Profile header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm dark:bg-emerald-900/30 dark:text-emerald-400">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                    <Badge className={kycColors[selectedCustomer.kycLevel]}>
                      <Shield className="mr-1 h-3 w-3" />
                      {selectedCustomer.kycLevel === 'full' ? 'Full KYC' : selectedCustomer.kycLevel === 'basic' ? 'Basic KYC' : 'No KYC'}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5 rounded-lg border p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium truncate ml-4">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{selectedCustomer.location || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-medium">{formatDate(selectedCustomer.memberSince)}</span>
                  </div>
                </div>

                {/* Susu Groups */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Active Susu Groups</p>
                  <div className="space-y-1.5">
                    {mockSusuGroups.map((group) => (
                      <div
                        key={group.name}
                        className="mobile-list-item flex items-center justify-between rounded-md border p-2.5 text-sm"
                      >
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.frequency} • {formatGHS(group.amount)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{group.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Transactions</p>
                  <div className="max-h-48 space-y-1.5 overflow-y-auto overscroll-contain">
                    {mockTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="mobile-list-item flex items-center justify-between rounded-md border p-2.5 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{tx.desc}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                        </div>
                        <div className="ml-2 text-right">
                          <p className="font-semibold">{formatGHS(tx.amount)}</p>
                          <Badge className={`text-[10px] ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
