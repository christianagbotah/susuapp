'use client';

import { useState } from 'react';
import { useAgentStore } from '@/store/app-store';
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
  Fingerprint, Globe, Clock, Target, Sun, Moon, MapPin
} from 'lucide-react';

export function AgentSettings() {
  const { user } = useAgentStore();

  // Profile form state
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [branch, setBranch] = useState('Accra Central');
  const [territory, setTerritory] = useState('Makola Market');

  // Collections preferences
  const [morningCollection, setMorningCollection] = useState(true);
  const [eveningCollection, setEveningCollection] = useState(false);
  const [dailyTarget, setDailyTarget] = useState('5000');
  const [collectionNotifications, setCollectionNotifications] = useState({
    collectionReminders: true,
    newCustomerAlerts: true,
    commissionUpdates: true,
    missedPaymentAlerts: true,
    sms: true,
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
      device: 'Android Phone (Samsung Galaxy A54)',
      location: 'Accra, Ghana',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: '2',
      device: 'Chrome on Windows',
      location: 'Accra, Ghana',
      lastActive: '3 hours ago',
      current: false,
    },
    {
      id: '3',
      device: 'Safari on iPhone 13',
      location: 'Tema, Ghana',
      lastActive: '2 days ago',
      current: false,
    },
  ]);

  const [revokedSessions, setRevokedSessions] = useState<Set<string>>(new Set());

  // Daily target progress (mock)
  const targetProgress = 65;

  const handleSaveProfile = () => {
    toast.success('Profile updated!', {
      description: 'Your agent profile changes have been saved successfully.',
    });
  };

  const handleCollectionToggle = (key: keyof typeof collectionNotifications) => {
    setCollectionNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveCollections = () => {
    toast.success('Collection preferences saved!', {
      description: 'Your collection schedule and targets have been updated.',
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
      description: 'Your agent PIN has been updated successfully.',
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
          Manage your agent profile, collection preferences, and security
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="collections" className="gap-2">
            <Target className="h-4 w-4 hidden sm:block" />
            Collections
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
              <CardTitle>Agent Profile</CardTitle>
              <CardDescription>Update your personal details and agent information</CardDescription>
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
                    Agent since {formatDate(user.memberSince)}
                  </p>
                </div>
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
                  <Label htmlFor="agentCode">Agent Code</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="agentCode"
                      value="AGT-0042"
                      disabled
                      className="h-12 bg-muted"
                    />
                    <Badge variant="secondary" className="shrink-0">Read-only</Badge>
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
                <div className="space-y-2">
                  <Label htmlFor="territory">Territory</Label>
                  <Input
                    id="territory"
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    placeholder="e.g. Makola, Kaneshie"
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

        {/* ============ COLLECTIONS TAB ============ */}
        <TabsContent value="collections" className="space-y-6">
          {/* Collection Times */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Collection Schedule
              </CardTitle>
              <CardDescription>
                Set your preferred collection time windows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Morning Collection</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable morning collection rounds (6 AM – 12 PM)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={morningCollection}
                  onCheckedChange={(checked) => {
                    setMorningCollection(checked);
                    toast.success(
                      checked
                        ? 'Morning collections enabled'
                        : 'Morning collections disabled'
                    );
                  }}
                  className="scale-110"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Evening Collection</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable evening collection rounds (4 PM – 8 PM)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={eveningCollection}
                  onCheckedChange={(checked) => {
                    setEveningCollection(checked);
                    toast.success(
                      checked
                        ? 'Evening collections enabled'
                        : 'Evening collections disabled'
                    );
                  }}
                  className="scale-110"
                />
              </div>

              <Separator />

              {/* Daily Target */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-emerald-500" />
                    <div>
                      <Label className="text-sm font-medium">Daily Collection Target</Label>
                      <p className="text-xs text-muted-foreground">
                        Set your daily target amount
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    ₵{parseFloat(dailyTarget).toLocaleString()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">₵1,000</span>
                  <Input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground w-20 text-right">₵20,000</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={targetProgress} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {targetProgress}% of today&apos;s target
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Notifications */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Collection Notifications
              </CardTitle>
              <CardDescription>
                Choose how you receive collection-related alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'collectionReminders' as const,
                  label: 'Collection Reminders',
                  description: 'Reminders before scheduled collection visits',
                },
                {
                  key: 'newCustomerAlerts' as const,
                  label: 'New Customer Alerts',
                  description: 'Alerts when new customers are assigned to your route',
                },
                {
                  key: 'commissionUpdates' as const,
                  label: 'Commission Updates',
                  description: 'Notifications when commissions are credited',
                },
                {
                  key: 'missedPaymentAlerts' as const,
                  label: 'Missed Payment Alerts',
                  description: 'Alerts when customers miss their contribution',
                },
                {
                  key: 'sms' as const,
                  label: 'SMS Notifications',
                  description: 'Receive collection alerts via text message',
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
                    checked={collectionNotifications[item.key]}
                    onCheckedChange={() => handleCollectionToggle(item.key)}
                  />
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveCollections}>Save Preferences</Button>
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
                Update your agent PIN for secure authentication
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
                    Use fingerprint or face recognition to sign in to the agent app
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
                Devices currently logged into your agent account
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
