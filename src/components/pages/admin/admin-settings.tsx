'use client';

import { useState } from 'react';
import { useAdminStore } from '@/store/app-store';
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
  Fingerprint, Globe, Settings, History, Key, AlertTriangle, Copy, RefreshCw
} from 'lucide-react';

export function AdminSettings() {
  const { user } = useAdminStore();

  // Profile form state
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [branch, setBranch] = useState('Head Office');

  // System preferences
  const [defaultBranch, setDefaultBranch] = useState('head-office');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState({
    securityAlerts: true,
    loanAlerts: true,
    agentAlerts: true,
    systemAlerts: true,
    email: true,
    sms: true,
    push: true,
  });

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Security toggles
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // API key (mock)
  const [apiKey] = useState('isp_admin_sk_7f3a9b2c4d5e6f1a8b9c0d1e2f3a4b5c');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  // Active sessions (mock)
  const [sessions] = useState([
    {
      id: '1',
      device: 'Chrome on Windows (Desktop)',
      location: 'Accra, Ghana',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on MacBook Pro',
      location: 'Accra, Ghana',
      lastActive: '1 hour ago',
      current: false,
    },
    {
      id: '3',
      device: 'Firefox on Linux',
      location: 'Kumasi, Ghana',
      lastActive: '5 hours ago',
      current: false,
    },
  ]);

  const [revokedSessions, setRevokedSessions] = useState<Set<string>>(new Set());

  const handleSaveProfile = () => {
    toast.success('Profile updated!', {
      description: 'Your admin profile changes have been saved successfully.',
    });
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSystemSettings = () => {
    toast.success('System settings saved!', {
      description: 'Your system preferences have been updated.',
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Missing fields', {
        description: 'Please fill in all password fields.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'New password and confirmation must be the same.',
      });
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Weak password', {
        description: 'Password must be at least 8 characters long.',
      });
      return;
    }
    toast.success('Password changed', {
      description: 'Your admin password has been updated successfully.',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRevokeSession = (id: string, device: string) => {
    setRevokedSessions((prev) => new Set(prev).add(id));
    toast.success('Session revoked', {
      description: `${device} has been logged out.`,
    });
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey).then(
      () => toast.success('API key copied', { description: 'API key has been copied to clipboard.' }),
      () => toast.info('API key copied', { description: apiKey })
    );
  };

  const handleRegenerateApiKey = () => {
    toast.success('API key regenerated', {
      description: 'A new API key has been generated. The old key is now invalid.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your admin profile, system configuration, and security
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:block" />
            System
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4 hidden sm:block" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ============ PROFILE TAB ============ */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>Your administrator account information</CardDescription>
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
                    Admin since {formatDate(user.memberSince)}
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
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="role"
                      value="System Administrator"
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
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SYSTEM TAB ============ */}
        <TabsContent value="system" className="space-y-6">
          {/* System Configuration */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure default platform settings and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Branch */}
              <div className="space-y-2">
                <Label htmlFor="defaultBranch">Default Branch</Label>
                <p className="text-xs text-muted-foreground">
                  Select the branch shown by default when viewing reports
                </p>
                <div className="grid gap-2">
                  {[
                    { value: 'head-office', label: 'Head Office' },
                    { value: 'accra-central', label: 'Accra Central' },
                    { value: 'kumasi-adum', label: 'Kumasi Adum' },
                    { value: 'tema-community', label: 'Tema Community' },
                    { value: 'takoradi', label: 'Takoradi' },
                  ].map((b) => (
                    <div
                      key={b.value}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        defaultBranch === b.value
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                      onClick={() => setDefaultBranch(b.value)}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          defaultBranch === b.value
                            ? 'border-primary'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {defaultBranch === b.value && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Maintenance Mode */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable to temporarily disable customer access for system updates.
                      All active sessions will be terminated.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={(checked) => {
                    setMaintenanceMode(checked);
                    toast.success(
                      checked ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
                      {
                        description: checked
                          ? 'Customer portal is now inaccessible.'
                          : 'Customer portal is now accessible.',
                      }
                    );
                  }}
                  className="scale-110 shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose which system alerts you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'securityAlerts' as const,
                  label: 'Security Alerts',
                  description: 'Suspicious login attempts and security events',
                },
                {
                  key: 'loanAlerts' as const,
                  label: 'Loan Alerts',
                  description: 'New loan applications and overdue payments',
                },
                {
                  key: 'agentAlerts' as const,
                  label: 'Agent Performance Alerts',
                  description: 'Agent compliance and performance reports',
                },
                {
                  key: 'systemAlerts' as const,
                  label: 'System Alerts',
                  description: 'Platform errors, downtime, and updates',
                },
                {
                  key: 'email' as const,
                  label: 'Email Notifications',
                  description: 'Receive critical alerts via email',
                },
                {
                  key: 'sms' as const,
                  label: 'SMS Notifications',
                  description: 'Receive urgent alerts via text message',
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
                    checked={notifications[item.key]}
                    onCheckedChange={() => handleNotificationToggle(item.key)}
                  />
                </div>
              ))}

              {/* Audit Log Access */}
              <Separator className="my-2" />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Audit Log Access</Label>
                    <p className="text-xs text-muted-foreground">
                      View system-wide audit logs and activity history
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Audit Log', { description: 'Audit log viewer would open here.' })}>
                  <History className="mr-1.5 h-3.5 w-3.5" />
                  View Logs
                </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveSystemSettings}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SECURITY TAB ============ */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your admin password regularly to maintain security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword}>Update Password</Button>
              </div>
            </CardContent>
          </Card>

          {/* 2FA */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your admin account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Two-Factor Authentication (2FA)</Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Require a verification code via authenticator app when signing in
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    setTwoFactorEnabled(checked);
                    toast.success(
                      checked ? '2FA enabled' : '2FA disabled',
                      {
                        description: checked
                          ? 'You will need an authenticator code when signing in.'
                          : 'Two-factor authentication has been turned off.',
                      }
                    );
                  }}
                  className="scale-110"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Biometric Login</Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Use fingerprint or face recognition to sign in quickly
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

          {/* API Key */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key
              </CardTitle>
              <CardDescription>
                Your admin API key for system integrations and external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={apiKeyVisible ? apiKey : '•••••••••••••••••••••••••••••••••••••••'}
                  className="h-12 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-12 w-12"
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                >
                  {apiKeyVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-12 w-12"
                  onClick={handleCopyApiKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Keep your API key secret. Never share it in publicly accessible areas.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={handleRegenerateApiKey}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
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
                Devices currently logged into your admin account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions
                .filter((s) => !revokedSessions.has(s.id))
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-4"
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
