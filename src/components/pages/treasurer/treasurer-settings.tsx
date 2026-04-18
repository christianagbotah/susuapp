'use client';

import { useState } from 'react';
import { useTreasurerStore } from '@/store/app-store';
import { getInitials, formatPhoneGH, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  User, Shield, Bell, Lock, Smartphone, Camera, Eye, EyeOff,
  Fingerprint, Globe, Users, Clock, Landmark, Wallet
} from 'lucide-react';

export function TreasurerSettings() {
  const { user, managedGroups } = useTreasurerStore();

  // Profile form state
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [branch, setBranch] = useState('Accra Central');

  // Groups preferences
  const [defaultPayoutMethod, setDefaultPayoutMethod] = useState<'momo' | 'bank'>('momo');
  const [autoApproveSmallPayouts, setAutoApproveSmallPayouts] = useState(true);
  const [payoutNotifications, setPayoutNotifications] = useState({
    payoutReminders: true,
    memberJoinAlerts: true,
    memberLeaveAlerts: true,
    roundCompleteAlerts: true,
    email: true,
    push: true,
  });

  // PIN form state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Security toggles
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // Active sessions (mock)
  const [sessions] = useState([
    {
      id: '1',
      device: 'Samsung Galaxy A34',
      location: 'Accra, Ghana',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: '2',
      device: 'Chrome on Windows',
      location: 'Accra, Ghana',
      lastActive: '4 hours ago',
      current: false,
    },
  ]);

  const [revokedSessions, setRevokedSessions] = useState<Set<string>>(new Set());

  const handleSaveProfile = () => {
    toast.success('Profile updated!', {
      description: 'Your treasurer profile changes have been saved successfully.',
    });
  };

  const handlePayoutNotificationToggle = (key: keyof typeof payoutNotifications) => {
    setPayoutNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveGroups = () => {
    toast.success('Group settings saved!', {
      description: 'Your payout and group preferences have been updated.',
    });
  };

  const handleChangePin = () => {
    if (!currentPin || !newPin || !confirmPin) {
      toast.error('Missing fields', {
        description: 'Please fill in all PIN fields.',
      });
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match', {
        description: 'New PIN and confirmation must be the same.',
      });
      return;
    }
    if (newPin.length < 4) {
      toast.error('PIN too short', {
        description: 'PIN must be at least 4 digits.',
      });
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      toast.error('Invalid PIN', {
        description: 'PIN must contain only digits.',
      });
      return;
    }
    toast.success('PIN changed', {
      description: 'Your treasurer PIN has been updated successfully.',
    });
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleRevokeSession = (id: string, device: string) => {
    setRevokedSessions((prev) => new Set(prev).add(id));
    toast.success('Session revoked', {
      description: `${device} has been logged out.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your treasurer profile, group preferences, and security
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Users className="h-4 w-4 hidden sm:block" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4 hidden sm:block" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ============ PROFILE TAB ============ */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Treasurer Profile</CardTitle>
              <CardDescription>Your group treasurer information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                    onClick={() =>
                      toast.info('Upload feature', {
                        description: 'Profile photo upload is not available in demo mode.',
                      })
                    }
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div>
                  <p className="font-medium text-lg">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPhoneGH(user.phone)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Treasurer since {formatDate(user.memberSince)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Managed Groups Summary */}
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    Managing {managedGroups.length} Susu {managedGroups.length === 1 ? 'Group' : 'Groups'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {managedGroups.reduce((sum, g) => sum + g.members, 0)} total members across all groups
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {managedGroups.filter((g) => g.status === 'active').length} active
                </Badge>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">+233</span>
                    <Input
                      id="phone"
                      value={phone.replace('+233', '').replace(/^0/, '')}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="24 XXX XXXX"
                      className="flex-1 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Assigned branch"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ GROUPS TAB ============ */}
        <TabsContent value="groups" className="space-y-6">
          {/* Payout Settings */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payout Configuration
              </CardTitle>
              <CardDescription>
                Configure default payout methods and approval behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Payout Method */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Default Payout Method</Label>
                <p className="text-xs text-muted-foreground">
                  Select the default method used when processing payouts for your groups
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      defaultPayoutMethod === 'momo'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    onClick={() => setDefaultPayoutMethod('momo')}
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mobile Money (MoMo)</p>
                      <p className="text-xs text-muted-foreground">MTN, Vodafone, AirtelTigo</p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      defaultPayoutMethod === 'bank'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    onClick={() => setDefaultPayoutMethod('bank')}
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bank Transfer</p>
                      <p className="text-xs text-muted-foreground">GCB, Ecobank, CalBank</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Auto-approve Small Payouts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Auto-approve Small Payouts</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically approve payouts below ₵1,000 without manual review
                    </p>
                  </div>
                </div>
                <Switch
                  checked={autoApproveSmallPayouts}
                  onCheckedChange={(checked) => {
                    setAutoApproveSmallPayouts(checked);
                    toast.success(
                      checked
                        ? 'Auto-approve enabled'
                        : 'Auto-approve disabled',
                      {
                        description: checked
                          ? 'Payouts under ₵1,000 will be processed automatically.'
                          : 'All payouts will require manual approval.',
                      }
                    );
                  }}
                  className="scale-110"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGroups}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>

          {/* Payout Notification Preferences */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Payout Notifications
              </CardTitle>
              <CardDescription>
                Choose how you receive payout-related alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'payoutReminders' as const,
                  label: 'Payout Reminders',
                  description: 'Reminders before scheduled payout dates',
                },
                {
                  key: 'memberJoinAlerts' as const,
                  label: 'Member Join Alerts',
                  description: 'Notifications when new members join your groups',
                },
                {
                  key: 'memberLeaveAlerts' as const,
                  label: 'Member Leave Alerts',
                  description: 'Notifications when members leave or are removed',
                },
                {
                  key: 'roundCompleteAlerts' as const,
                  label: 'Round Complete Alerts',
                  description: 'Alerts when a susu round completes and payout is due',
                },
                {
                  key: 'email' as const,
                  label: 'Email Notifications',
                  description: 'Receive payout alerts via email',
                },
                {
                  key: 'push' as const,
                  label: 'Push Notifications',
                  description: 'Receive push notifications on your device',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={payoutNotifications[item.key]}
                    onCheckedChange={() => handlePayoutNotificationToggle(item.key)}
                  />
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveGroups}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SECURITY TAB ============ */}
        <TabsContent value="security" className="space-y-6">
          {/* Change PIN */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change PIN
              </CardTitle>
              <CardDescription>
                Update your treasurer PIN for secure authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPin">Current PIN</Label>
                <div className="relative">
                  <Input
                    id="currentPin"
                    type={showCurrentPin ? 'text' : 'password'}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Enter current PIN"
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                  >
                    {showCurrentPin ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPin">New PIN</Label>
                <div className="relative">
                  <Input
                    id="newPin"
                    type={showNewPin ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new PIN (min 4 digits)"
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPin(!showNewPin)}
                  >
                    {showNewPin ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPin">Confirm New PIN</Label>
                <div className="relative">
                  <Input
                    id="confirmPin"
                    type={showConfirmPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Confirm new PIN"
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePin}>Update PIN</Button>
              </div>
            </CardContent>
          </Card>

          {/* Biometric */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Biometric Login
              </CardTitle>
              <CardDescription>
                Use fingerprint or face recognition to sign in quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Biometric Authentication</Label>
                  <p className="text-xs text-muted-foreground">
                    Use fingerprint or face recognition to sign in to the treasurer app
                  </p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={(checked) => {
                    setBiometricEnabled(checked);
                    toast.success(
                      checked ? 'Biometric login enabled' : 'Biometric login disabled',
                      {
                        description: checked
                          ? 'You can now use biometrics to sign in.'
                          : 'Biometric sign-in has been turned off.',
                      }
                    );
                  }}
                  className="scale-110"
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Devices currently logged into your treasurer account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions
                .filter((s) => !revokedSessions.has(s.id))
                .map((session) => (
                  <div
                    key={session.id}
                    className="mobile-list-item flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Smartphone className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {session.device}
                          </p>
                          {session.current && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.location} • {session.lastActive}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                        onClick={() => handleRevokeSession(session.id, session.device)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
