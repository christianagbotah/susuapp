'use client';

import { useState, useCallback } from 'react';
import { useAgentStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, Search, Phone, Bell, Eye, MapPin, CalendarDays, Shield,
  IdCard, CheckCircle, AlertTriangle, Camera, Upload, Loader2, Heart, Home,
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

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta',
  'Northern', 'Brong-Ahafo', 'Upper East', 'Upper West', 'North East',
  'Savannah', 'Bono East', 'Ahafo', 'Oti', 'Western North',
];

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];

const GHA_ID_REGEX = /^GHA-\d{9}-\d$/;

const kycColors: Record<string, string> = {
  full: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  basic: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  none: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

interface KYCFormData {
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  region: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  addressRegion: string;
  digitalAddress: string;
  cardImage: string | null;
  cardImageFile: File | null;
}

const initialKYCForm: KYCFormData = {
  idNumber: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  region: '',
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: '',
  houseNumber: '',
  street: '',
  area: '',
  city: '',
  addressRegion: '',
  digitalAddress: '',
  cardImage: null,
  cardImageFile: null,
};

export function AgentCustomers() {
  const { allCustomers, verifyCustomerKYC } = useAgentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<UserType | null>(null);
  const [kycVerifyOpen, setKycVerifyOpen] = useState(false);
  const [kycVerifyCustomer, setKycVerifyCustomer] = useState<UserType | null>(null);
  const [kycForm, setKycForm] = useState<KYCFormData>(initialKYCForm);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycActiveTab, setKycActiveTab] = useState('card-info');

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

  function handleOpenKycVerify(customer: UserType) {
    setKycVerifyCustomer(customer);
    setKycForm(initialKYCForm);
    setKycActiveTab('card-info');
    setKycVerifyOpen(true);
  }

  const handleCardImageCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setKycForm((prev) => ({ ...prev, cardImage: reader.result as string, cardImageFile: file }));
    };
    reader.readAsDataURL(file);
  }, []);

  function validateKYCForm(): string | null {
    if (kycForm.cardImageFile) {
      // Card captured via image — still require ID number
      if (!GHA_ID_REGEX.test(kycForm.idNumber)) {
        return 'Please enter a valid Ghana Card ID in format GHA-XXXXXXXXX-X';
      }
    } else {
      // Manual entry — require all card fields
      if (!GHA_ID_REGEX.test(kycForm.idNumber)) {
        return 'Please enter a valid Ghana Card ID in format GHA-XXXXXXXXX-X';
      }
      if (!kycForm.fullName.trim()) {
        return 'Please enter the full name as it appears on the Ghana Card';
      }
      if (!kycForm.dateOfBirth.trim()) {
        return 'Please enter the date of birth';
      }
      if (!kycForm.gender) {
        return 'Please select gender';
      }
    }
    if (!kycForm.nextOfKinName.trim()) {
      return 'Please enter next of kin name';
    }
    if (!kycForm.nextOfKinPhone.trim()) {
      return 'Please enter next of kin phone number';
    }
    if (!kycForm.nextOfKinRelationship) {
      return 'Please select next of kin relationship';
    }
    if (!kycForm.area.trim() || !kycForm.city.trim() || !kycForm.addressRegion) {
      return 'Please fill in the address fields (Area, City, Region)';
    }
    return null;
  }

  async function handleSubmitKYCVerification() {
    if (!kycVerifyCustomer) return;
    const validationError = validateKYCForm();
    if (validationError) {
      toast.error('Validation Error', { description: validationError });
      return;
    }

    setKycSubmitting(true);
    try {
      const payload = {
        cardData: {
          idNumber: kycForm.idNumber.toUpperCase().trim(),
          fullName: kycForm.fullName.toUpperCase().trim(),
          dateOfBirth: kycForm.dateOfBirth,
          gender: kycForm.gender,
          region: kycForm.region,
          documentType: 'Ghana Card',
        },
        addressInfo: {
          houseNumber: kycForm.houseNumber.trim(),
          street: kycForm.street.trim(),
          area: kycForm.area.trim(),
          city: kycForm.city.trim(),
          region: kycForm.addressRegion,
          digitalAddress: kycForm.digitalAddress.trim(),
        },
        nextOfKin: {
          name: kycForm.nextOfKinName.trim(),
          phone: kycForm.nextOfKinPhone.trim(),
          relationship: kycForm.nextOfKinRelationship,
        },
      };

      const res = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const newLevel = (data.kycLevel || 'basic') as 'basic' | 'full';
        verifyCustomerKYC(kycVerifyCustomer.id, newLevel);
        toast.success('KYC Verification Submitted', {
          description: `${kycVerifyCustomer.name}'s KYC has been ${newLevel === 'full' ? 'fully verified' : 'submitted for review'}.`,
        });
        setKycVerifyOpen(false);
        setKycVerifyCustomer(null);
        setKycForm(initialKYCForm);
        // Also update selectedCustomer if it's the same one
        setSelectedCustomer((prev) =>
          prev && prev.id === kycVerifyCustomer.id ? { ...prev, kycLevel: newLevel } : prev
        );
      } else {
        toast.error('KYC Verification Failed', {
          description: data.error || 'Verification failed. Please try again.',
        });
      }
    } catch {
      toast.error('Error', { description: 'Network error. Please try again.' });
    } finally {
      setKycSubmitting(false);
    }
  }

  function needsKycVerification(customer: UserType): boolean {
    return customer.kycLevel === 'none' || customer.kycLevel === 'basic';
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
                          {needsKycVerification(customer) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                              onClick={() => handleOpenKycVerify(customer)}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
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
                          {needsKycVerification(customer) && (
                            <Button
                              size="sm"
                              className="flex-1 min-h-[44px] lg:min-h-0 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                              onClick={() => handleOpenKycVerify(customer)}
                            >
                              <Shield className="mr-1 h-3.5 w-3.5" />
                              Verify KYC
                            </Button>
                          )}
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

                {/* KYC Verification Status */}
                <div className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm font-semibold">KYC Verification Status</p>
                    </div>
                    <Badge className={kycColors[selectedCustomer.kycLevel]}>
                      {selectedCustomer.kycLevel === 'full' ? '✓ Full KYC' : selectedCustomer.kycLevel === 'basic' ? '~ Basic KYC' : '✗ Not Verified'}
                    </Badge>
                  </div>

                  {selectedCustomer.kycLevel === 'full' ? (
                    <div className="space-y-2 rounded-md bg-emerald-50 p-3 dark:bg-emerald-900/10">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Fully Verified</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>This customer has completed full KYC verification.</p>
                        <p>They have access to all services including loans and higher transaction limits.</p>
                      </div>
                    </div>
                  ) : selectedCustomer.kycLevel === 'basic' ? (
                    <div className="space-y-2 rounded-md bg-amber-50 p-3 dark:bg-amber-900/10">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Basic KYC Only</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Customer has partial verification. Help them upgrade to Full KYC to unlock all features.</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                        onClick={() => {
                          setSelectedCustomer(null);
                          handleOpenKycVerify(selectedCustomer);
                        }}
                      >
                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                        Upgrade KYC to Full
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-md bg-gray-50 p-3 dark:bg-gray-900/20">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Not Verified</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>This customer has not completed KYC verification yet. They need to be verified to access loans and higher limits.</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                        onClick={() => {
                          setSelectedCustomer(null);
                          handleOpenKycVerify(selectedCustomer);
                        }}
                      >
                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                        Initiate KYC Verification
                      </Button>
                    </div>
                  )}
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

      {/* KYC Verification Dialog */}
      <Dialog open={kycVerifyOpen} onOpenChange={(open) => {
        if (!open) {
          setKycVerifyOpen(false);
          setKycVerifyCustomer(null);
          setKycForm(initialKYCForm);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
          {kycVerifyCustomer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 p-2">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle>KYC Verification</DialogTitle>
                    <DialogDescription>
                      Help {kycVerifyCustomer.name} complete their KYC verification
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Customer info summary */}
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {getInitials(kycVerifyCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{kycVerifyCustomer.name}</p>
                    <p className="text-xs text-muted-foreground">{kycVerifyCustomer.phone}</p>
                  </div>
                  <Badge className={kycColors[kycVerifyCustomer.kycLevel]}>
                    {kycVerifyCustomer.kycLevel === 'full' ? 'Full' : kycVerifyCustomer.kycLevel === 'basic' ? 'Basic' : 'None'}
                  </Badge>
                </div>

                <Tabs value={kycActiveTab} onValueChange={setKycActiveTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="card-info" className="min-h-[44px] text-xs sm:text-sm">
                      <IdCard className="mr-1 h-3.5 w-3.5 hidden sm:inline-block" />
                      Card Info
                    </TabsTrigger>
                    <TabsTrigger value="next-of-kin" className="min-h-[44px] text-xs sm:text-sm">
                      <Heart className="mr-1 h-3.5 w-3.5 hidden sm:inline-block" />
                      Next of Kin
                    </TabsTrigger>
                    <TabsTrigger value="address" className="min-h-[44px] text-xs sm:text-sm">
                      <Home className="mr-1 h-3.5 w-3.5 hidden sm:inline-block" />
                      Address
                    </TabsTrigger>
                  </TabsList>

                  {/* Card Info Tab */}
                  <TabsContent value="card-info" className="space-y-4 mt-4">
                    {/* Card Capture Area */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Ghana Card (Optional Capture)</Label>
                      <div className="relative rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-700 dark:bg-amber-900/10">
                        {kycForm.cardImage ? (
                          <div className="space-y-2">
                            <img
                              src={kycForm.cardImage}
                              alt="Captured Ghana Card"
                              className="w-full h-40 object-cover rounded-md"
                            />
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span className="text-xs text-emerald-700 dark:text-emerald-400">Card image captured</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="ml-auto text-xs"
                                onClick={() => setKycForm((p) => ({ ...p, cardImage: null, cardImageFile: null }))}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-4">
                            <Camera className="h-8 w-8 text-amber-400" />
                            <p className="text-sm text-muted-foreground text-center">
                              Capture or upload a photo of the Ghana Card
                            </p>
                            <div className="flex gap-2">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={handleCardImageCapture}
                                />
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600 min-h-[44px]">
                                  <Camera className="h-3.5 w-3.5" />
                                  Camera
                                </span>
                              </label>
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleCardImageCapture}
                                />
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-medium text-amber-600 border border-amber-300 hover:bg-amber-50 min-h-[44px] dark:bg-gray-800 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20">
                                  <Upload className="h-3.5 w-3.5" />
                                  Upload
                                </span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual Entry Fallback */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground">or enter manually</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="kyc-id-number" className="text-sm">Ghana Card ID Number *</Label>
                        <Input
                          id="kyc-id-number"
                          placeholder="GHA-XXXXXXXXX-X"
                          value={kycForm.idNumber}
                          onChange={(e) => setKycForm((p) => ({ ...p, idNumber: e.target.value.toUpperCase() }))}
                          className="min-h-[44px] font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Format: GHA- followed by 9 digits, dash, 1 digit
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="kyc-full-name" className="text-sm">Full Name (as on card) *</Label>
                        <Input
                          id="kyc-full-name"
                          placeholder="e.g. MENSAH AMA SERWAA"
                          value={kycForm.fullName}
                          onChange={(e) => setKycForm((p) => ({ ...p, fullName: e.target.value }))}
                          className="min-h-[44px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="kyc-dob" className="text-sm">Date of Birth *</Label>
                          <Input
                            id="kyc-dob"
                            placeholder="DD/MM/YYYY"
                            value={kycForm.dateOfBirth}
                            onChange={(e) => setKycForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                            className="min-h-[44px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="kyc-gender" className="text-sm">Gender *</Label>
                          <Select value={kycForm.gender} onValueChange={(v) => setKycForm((p) => ({ ...p, gender: v }))}>
                            <SelectTrigger className="min-h-[44px]">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="kyc-card-region" className="text-sm">Card Region</Label>
                        <Select value={kycForm.region} onValueChange={(v) => setKycForm((p) => ({ ...p, region: v }))}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Select region on card" />
                          </SelectTrigger>
                          <SelectContent>
                            {GHANA_REGIONS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Next of Kin Tab */}
                  <TabsContent value="next-of-kin" className="space-y-4 mt-4">
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/10">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm font-medium">Next of Kin Information</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please provide the next of kin details for this customer.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="kyc-nok-name" className="text-sm">Full Name *</Label>
                        <Input
                          id="kyc-nok-name"
                          placeholder="e.g. Kwame Mensah"
                          value={kycForm.nextOfKinName}
                          onChange={(e) => setKycForm((p) => ({ ...p, nextOfKinName: e.target.value }))}
                          className="min-h-[44px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="kyc-nok-phone" className="text-sm">Phone Number *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+233</span>
                          <Input
                            id="kyc-nok-phone"
                            placeholder="XX XXX XXXX"
                            value={kycForm.nextOfKinPhone}
                            onChange={(e) => setKycForm((p) => ({ ...p, nextOfKinPhone: e.target.value }))}
                            className="min-h-[44px] pl-14"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="kyc-nok-rel" className="text-sm">Relationship *</Label>
                        <Select value={kycForm.nextOfKinRelationship} onValueChange={(v) => setKycForm((p) => ({ ...p, nextOfKinRelationship: v }))}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIPS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Address Tab */}
                  <TabsContent value="address" className="space-y-4 mt-4">
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/10">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <Home className="h-4 w-4" />
                        <span className="text-sm font-medium">Residential Address</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the customer's residential address information.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="kyc-house" className="text-sm">House No.</Label>
                          <Input
                            id="kyc-house"
                            placeholder="e.g. 24"
                            value={kycForm.houseNumber}
                            onChange={(e) => setKycForm((p) => ({ ...p, houseNumber: e.target.value }))}
                            className="min-h-[44px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="kyc-street" className="text-sm">Street</Label>
                          <Input
                            id="kyc-street"
                            placeholder="e.g. Osu Oxford Street"
                            value={kycForm.street}
                            onChange={(e) => setKycForm((p) => ({ ...p, street: e.target.value }))}
                            className="min-h-[44px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="kyc-area" className="text-sm">Area / Locality *</Label>
                        <Input
                          id="kyc-area"
                          placeholder="e.g. Osu"
                          value={kycForm.area}
                          onChange={(e) => setKycForm((p) => ({ ...p, area: e.target.value }))}
                          className="min-h-[44px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="kyc-city" className="text-sm">City / Town *</Label>
                          <Input
                            id="kyc-city"
                            placeholder="e.g. Accra"
                            value={kycForm.city}
                            onChange={(e) => setKycForm((p) => ({ ...p, city: e.target.value }))}
                            className="min-h-[44px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="kyc-addr-region" className="text-sm">Region *</Label>
                          <Select value={kycForm.addressRegion} onValueChange={(v) => setKycForm((p) => ({ ...p, addressRegion: v }))}>
                            <SelectTrigger className="min-h-[44px]">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {GHANA_REGIONS.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="kyc-digital" className="text-sm">Digital Address (Ghana Post GPS)</Label>
                        <Input
                          id="kyc-digital"
                          placeholder="e.g. GA-234-5678"
                          value={kycForm.digitalAddress}
                          onChange={(e) => setKycForm((p) => ({ ...p, digitalAddress: e.target.value.toUpperCase() }))}
                          className="min-h-[44px] font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Format: XX-XXX-XXXX (e.g., GA-234-5678)
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Submit Button */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>Ensure all required fields are completed before submitting. The information will be verified against NIA records.</span>
                  </div>
                  <Button
                    className="w-full min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold"
                    disabled={kycSubmitting}
                    onClick={handleSubmitKYCVerification}
                  >
                    {kycSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying with NIA...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Submit KYC Verification
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
