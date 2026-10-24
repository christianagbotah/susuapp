'use client';

import { useNavigationStore } from '@/store/app-store';
import { getRole } from '@/lib/rbac';
import { formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  UserCog, Building2, Phone, Mail, ShieldCheck, Bell, Globe,
  Fingerprint, Moon, Sun, LogOut, KeyRound, Lock, CheckCircle2, Circle,
} from 'lucide-react';
import { useTheme } from 'next-themes';

// Permissions visible per portal (subset labels for display)
const PERMISSION_LABELS: Record<string, string> = {
  'loans.approve': 'Approve high-value loans',
  'loans.recommend': 'Recommend loans after appraisal',
  'agents.onboard': 'Onboard field agents',
  'agents.supervise': 'Supervise field agents',
  'agents.verify_collections': 'Verify agent collections',
  'staff.manage': 'Manage branch staff',
  'branch.targets_manage': 'Set branch targets',
  'kyc.approve': 'Approve KYC upgrades',
  'cash.handle_drawer': 'Operate cash drawer',
  'cash.eod_reconcile': 'End-of-day reconciliation',
  'cash.vault_transfer': 'Vault & bank transfers',
  'ledger.post': 'Post journal entries',
  'ledger.close_period': 'Close accounting periods',
  'reports.financial': 'Prepare financial statements',
  'payroll.process': 'Process payroll (SSNIT & PAYE)',
  'aml.monitor': 'Monitor AML alerts',
  'aml.file_str': 'File STRs with FIC',
  'bog.file_returns': 'File Bank of Ghana returns',
  'kyc.review': 'Review KYC submissions',
  'audit.view': 'View audit trail',
  'analytics.view_all': 'View branch analytics',
  'ai.use': 'Use Susu AI assistant',
};

export function StaffSettings({ portal, userName, userEmail, userPhone, branch }: {
  portal: string; userName: string; userEmail: string; userPhone: string; branch: string;
}) {
  const { theme, setTheme } = useTheme();
  const role = getRole(portal as never);
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [language, setLanguage] = useState('English');

  return (
    <div className="space-y-5">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserCog className="h-5 w-5 text-primary" /> Profile</CardTitle>
          <CardDescription>Your staff account at iSusuPro Ghana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {userName.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="font-semibold">{userName}</p>
              <Badge className="mt-1 bg-primary/10 text-primary">{role.label}</Badge>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {userEmail}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {userPhone}</p>
            <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {branch}</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> Joined {formatDate('2022-06-01')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Role permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-5 w-5 text-amber-500" /> Role & Permissions</CardTitle>
          <CardDescription>{role.description}. Managed by RBAC — changes require System Admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {role.permissions.map((p) => (
              <div key={p} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="truncate">{PERMISSION_LABELS[p] ?? p}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-5 w-5 text-blue-500" /> Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push">Push notifications</Label>
              <p className="text-xs text-muted-foreground">Approvals, alerts & route updates</p>
            </div>
            <Switch id="push" checked={notifPush} onCheckedChange={setNotifPush} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email">Email digest</Label>
              <p className="text-xs text-muted-foreground">Daily 6pm summary of your portal</p>
            </div>
            <Switch id="email" checked={notifEmail} onCheckedChange={setNotifEmail} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bio">Biometric sign-in</Label>
              <p className="text-xs text-muted-foreground">Fingerprint / Face ID on mobile & desktop</p>
            </div>
            <Switch id="bio" checked={biometric} onCheckedChange={setBiometric} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="lang">Language</Label>
              <p className="text-xs text-muted-foreground">English, Twi, Ga, Ewe, Hausa, Dagbani</p>
            </div>
            <select
              id="lang"
              value={language}
              onChange={(e) => { setLanguage(e.target.value); toast.success(`Language set to ${e.target.value}`); }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {['English', 'Twi', 'Ga', 'Ewe', 'Hausa', 'Dagbani'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Appearance</Label>
              <p className="text-xs text-muted-foreground">Light or dark mode</p>
            </div>
            <Button variant="outline" size="sm" className="min-h-[40px] touch-manipulation" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-5 w-5 text-red-500" /> Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start min-h-[44px] touch-manipulation" onClick={() => toast.success('PIN reset link sent to your email')}>
            <KeyRound className="mr-2 h-4 w-4" /> Change transaction PIN
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start min-h-[44px] border-red-200 text-red-600 touch-manipulation hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => useNavigationStore.getState().logout()}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
