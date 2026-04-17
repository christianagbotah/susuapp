'use client';

import { useState } from 'react';
import { useCustomerStore } from '@/store/app-store';
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
import { User, Shield, Bell, Lock, Smartphone, Camera, Upload, CheckCircle, AlertCircle, Eye, EyeOff, Fingerprint, Key, Globe, Mail, MessageSquare, Trash2 } from 'lucide-react';

export function CustomerSettings() {
  const { user } = useCustomerStore();

  // Profile form
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState(user.location || '');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Security toggles
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    transactionAlerts: true,
    loanReminders: true,
    susuReminders: true,
    marketing: false,
    securityAlerts: true,
  });

  // Active sessions (mock)
  const [sessions] = useState([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'Accra, Ghana',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone 15',
      location: 'Accra, Ghana',
      lastActive: '2 hours ago',
      current: false,
    },
    {
      id: '3',
      device: 'Firefox on MacOS',
      location: 'Kumasi, Ghana',
      lastActive: '3 days ago',
      current: false,
    },
  ]);

  const [revokedSessions, setRevokedSessions] = useState<Set<string>>(new Set());

  const handleSaveProfile = () => {
    toast.success('Profile updated!', {
      description: 'Your changes have been saved successfully.',
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
      description: 'Your password has been updated successfully.',
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

  const handleDeactivate = () => {
    toast.error('Account deactivation cancelled', {
      description: 'Please contact support to deactivate your account.',
    });
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUploadClick = (label: string) => {
    toast.info('Upload feature', {
      description: `${label} upload is not available in demo mode.`,
    });
  };

  const handleKYCSubmit = () => {
    toast.success('KYC verification submitted', {
      description: 'Your documents have been submitted for review.',
    });
  };

  // KYC level logic
  const kycSteps = [
    { label: 'Phone Verified', completed: user.kycLevel !== 'none' },
    { label: 'ID Verified', completed: user.kycLevel === 'basic' || user.kycLevel === 'full' },
    { label: 'Address Verified', completed: user.kycLevel === 'full' },
  ];
  const kycProgress = kycSteps.filter((s) => s.completed).length;
  const kycLevelLabel =
    user.kycLevel === 'full' ? 'Full KYC' : user.kycLevel === 'basic' ? 'Basic KYC' : 'Not Verified';
  const kycLevelColor =
    user.kycLevel === 'full'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      : user.kycLevel === 'basic'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your account, security, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-2">
            <Shield className="h-4 w-4 hidden sm:block" />
            KYC
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4 hidden sm:block" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4 hidden sm:block" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* ============ PROFILE TAB ============ */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                    onClick={() => handleUploadClick('Profile photo')}
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div>
                  <p className="font-medium text-lg">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPhoneGH(user.phone)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since {formatDate(user.memberSince)}
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
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address / Location</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address or location"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ KYC TAB ============ */}
        <TabsContent value="kyc" className="space-y-6">
          {/* Current Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                KYC Verification Level
              </CardTitle>
              <CardDescription>
                Complete verification to unlock higher transaction limits and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={`text-sm px-3 py-1 ${kycLevelColor}`}>
                    {kycLevelLabel}
                  </Badge>
                  {user.kycLevel === 'full' && (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Fully Verified
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {kycProgress} of {kycSteps.length} steps
                </span>
              </div>

              {/* Progress steps */}
              <div className="space-y-3">
                <Progress value={(kycProgress / kycSteps.length) * 100} className="h-2" />
                <div className="grid gap-3 sm:grid-cols-3">
                  {kycSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                        step.completed
                          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                          : 'border-muted bg-muted/30'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={step.completed ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Documents</CardTitle>
              <CardDescription>Upload required documents for identity verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: 'Ghana Card / Passport',
                  description: 'National ID card or valid passport',
                  verified: true,
                },
                {
                  label: 'Selfie Verification',
                  description: 'A clear photo of yourself holding your ID',
                  verified: true,
                },
                {
                  label: 'Proof of Address (Utility Bill)',
                  description: 'Recent utility bill showing your name and address',
                  verified: true,
                },
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {doc.verified ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{doc.label}</p>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {doc.verified ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Verified
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadClick(doc.label)}
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Next of Kin */}
              <Separator className="my-2" />
              <div>
                <h4 className="font-medium text-sm mb-3">Next of Kin Information</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input defaultValue="Kwame Mensah" disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <Input defaultValue="+233 24 555 1234" disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Relationship</Label>
                    <Input defaultValue="Spouse" disabled />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit button */}
          {user.kycLevel !== 'full' && (
            <div className="flex justify-end">
              <Button onClick={handleKYCSubmit}>
                <Shield className="mr-2 h-4 w-4" />
                Submit for Verification
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ============ SECURITY TAB ============ */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password regularly to keep your account secure
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
                    placeholder="Enter new password"
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

          {/* 2FA & Biometric */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Authentication Methods
              </CardTitle>
              <CardDescription>
                Manage additional security layers for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Two-Factor */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Receive a verification code via SMS when signing in
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
                          ? 'You will receive SMS codes when signing in.'
                          : 'SMS verification codes will no longer be required.',
                      }
                    );
                  }}
                />
              </div>

              <Separator />

              {/* Biometric */}
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
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Devices currently logged into your account
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

          {/* Deactivate Account */}
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Deactivate Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently deactivate your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeactivate}
                  className="shrink-0 gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ NOTIFICATIONS TAB ============ */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how and when you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channel toggles */}
              <div>
                <h4 className="text-sm font-medium mb-3">Notification Channels</h4>
                <div className="space-y-4">
                  {[
                    {
                      key: 'email' as const,
                      label: 'Email Notifications',
                      description: 'Receive notifications via email',
                      icon: Mail,
                    },
                    {
                      key: 'sms' as const,
                      label: 'SMS Notifications',
                      description: 'Receive notifications via text message',
                      icon: MessageSquare,
                    },
                    {
                      key: 'push' as const,
                      label: 'Push Notifications',
                      description: 'Receive push notifications on your device',
                      icon: Bell,
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm font-medium">{item.label}</Label>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications[item.key]}
                        onCheckedChange={() => handleNotificationToggle(item.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Alert toggles */}
              <div>
                <h4 className="text-sm font-medium mb-3">Alert Types</h4>
                <div className="space-y-4">
                  {[
                    {
                      key: 'transactionAlerts' as const,
                      label: 'Transaction Alerts',
                      description: 'Get notified for every transaction on your account',
                    },
                    {
                      key: 'loanReminders' as const,
                      label: 'Loan Payment Reminders',
                      description: 'Reminders before loan payment due dates',
                    },
                    {
                      key: 'susuReminders' as const,
                      label: 'Susu Contribution Reminders',
                      description: 'Reminders for upcoming susu contributions',
                    },
                    {
                      key: 'marketing' as const,
                      label: 'Marketing Emails',
                      description: 'Promotional offers, tips, and product updates',
                    },
                    {
                      key: 'securityAlerts' as const,
                      label: 'Security Alerts',
                      description: 'Alerts for suspicious activity and login attempts',
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
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    toast.success('Preferences saved', {
                      description: 'Your notification preferences have been updated.',
                    })
                  }
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
