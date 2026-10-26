'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, ShieldCheck, Users, Wallet, PiggyBank, Building2, UserCog,
  ClipboardCheck, Scale, Radio, BookOpen, FileWarning, LayoutDashboard,
  Landmark, Phone, Lock, ArrowRight, Eye, EyeOff, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useNavigationStore } from '@/store/app-store';
import { apiFetch, ensureBackendStarted } from '@/lib/api-client';
import { toast } from 'sonner';
import type { PortalId } from '@/lib/types';

const DEMO_PIN = '123456';
const PORTAL_IDS: readonly PortalId[] = [
  'customer', 'agent', 'admin', 'treasurer', 'branch-manager',
  'loan-officer', 'teller', 'field-supervisor', 'accountant', 'compliance-officer',
] as const;

// ---- Demo accounts (one per portal; `live` entries exist in the NestJS seed) ----
interface DemoAccount {
  id: string;
  name: string;
  role: string;
  portal: PortalId;
  phone: string;
  icon: React.ElementType;
  live?: boolean;
}

const demoAccounts: DemoAccount[] = [
  // Customer & community — these exist in the live API seed, PIN 123456
  { id: 'ama', name: 'Ama Mensah', role: 'Customer', portal: 'customer', phone: '0241234567', icon: Wallet, live: true },
  { id: 'kwame', name: 'Kwame Asante', role: 'Customer', portal: 'customer', phone: '0209876543', icon: Wallet, live: true },
  { id: 'patricia', name: 'Patricia Ampah', role: 'Group Treasurer', portal: 'treasurer', phone: '0246677889', icon: PiggyBank, live: true },
  { id: 'emmanuel', name: 'Emmanuel Osei', role: 'Susu Agent', portal: 'agent', phone: '0265566778', icon: Building2, live: true },
  // Branch & head office — staff portals backed by frontend demo data
  { id: 'nana', name: 'Nana Ampofo', role: 'Branch Manager', portal: 'branch-manager', phone: '0201110001', icon: UserCog },
  { id: 'efua', name: 'Efua Sarpong', role: 'Loan Officer', portal: 'loan-officer', phone: '0201110002', icon: ClipboardCheck },
  { id: 'yaw', name: 'Yaw Antwi', role: 'Teller / Cashier', portal: 'teller', phone: '0201110003', icon: Scale },
  { id: 'abena', name: 'Abena Frimpong', role: 'Field Supervisor', portal: 'field-supervisor', phone: '0201110004', icon: Radio },
  { id: 'kwesi', name: 'Kwesi Nyarko', role: 'Accountant', portal: 'accountant', phone: '0201110005', icon: BookOpen },
  { id: 'gifty', name: 'Gifty Owusu', role: 'Compliance Officer', portal: 'compliance-officer', phone: '0201110006', icon: FileWarning },
  { id: 'daniel', name: 'Daniel Tetteh', role: 'System Admin', portal: 'admin', phone: '0278899001', icon: LayoutDashboard, live: true },
];

const communityAccounts = demoAccounts.filter((a) => ['ama', 'kwame', 'patricia', 'emmanuel'].includes(a.id));
const staffAccounts = demoAccounts.filter((a) => !['ama', 'kwame', 'patricia', 'emmanuel'].includes(a.id));

// ---- Animation variants (consistent app-wide: opacity + small offset, easeOut) ----
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const formFieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

// ---- Demo account row (shared by dropdown items) ----
function DemoAccountOption({ account }: { account: DemoAccount }) {
  const Icon = account.icon;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
        <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight">
          {account.name}
          {account.live && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              API
            </span>
          )}
        </p>
        <p className="truncate text-[11px] leading-tight text-muted-foreground">
          {account.role} · {account.phone.slice(0, 3)} {account.phone.slice(3, 6)} {account.phone.slice(6)}
        </p>
      </div>
    </div>
  );
}

// ---- Component ----
export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const setPortal = useNavigationStore((s) => s.setPortal);

  const selectedAccount = demoAccounts.find((a) => a.id === selectedId) ?? null;
  const targetPortal: PortalId = selectedAccount?.portal ?? 'customer';

  const handleLogin = async () => {
    setIsLoading(true);
    const digits = phone.replace(/\D/g, '');
    const normalizedPhone = digits.length === 9 && !digits.startsWith('0') ? `0${digits}` : digits;

    const demoLogin = async (offline: boolean, portal: PortalId = targetPortal) => {
      await new Promise((r) => setTimeout(r, 600));
      setPortal(portal);
      setIsLoading(false);
      if (offline) toast.info('Signed in to demo mode — NestJS API not reachable in this session.');
    };

    const routePortal = (role?: string): PortalId =>
      PORTAL_IDS.includes(role as PortalId) ? (role as PortalId) : targetPortal;

    try {
      // 1) Try the NestJS backend directly
      const data = await apiFetch<{ accessToken: string; user: { name: string; role?: string } }>('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, pin }),
      });
      setPortal(routePortal(data.user.role));
      setIsLoading(false);
      toast.success(`Welcome back, ${data.user.name}! · Authenticated via iSusuPro API`);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        setIsLoading(false);
        // Staff demo accounts (branch & head office portals) are not in the
        // API seed — a 401 for their credentials means the API is reachable
        // but doesn't know this user. Fall back to demo login when the
        // entered credentials match a known demo account; otherwise it is a
        // genuine wrong-PIN error.
        const matchedDemo = demoAccounts.find(
          (a) => !a.live && a.phone === normalizedPhone,
        );
        if (matchedDemo && pin === DEMO_PIN) {
          setSelectedId(matchedDemo.id);
          await demoLogin(true, matchedDemo.portal);
          return;
        }
        toast.error('Invalid phone number or PIN. Demo PIN: 123456');
        return;
      }
      // 2) Network failure → ask the dev server to boot the API, then retry once
      try {
        const started = await ensureBackendStarted();
        if (started) {
          const data = await apiFetch<{ accessToken: string; user: { name: string; role?: string } }>('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: normalizedPhone, pin }),
          });
          setPortal(routePortal(data.user.role));
          setIsLoading(false);
          toast.success(`Welcome back, ${data.user.name}! · Authenticated via iSusuPro API`);
          return;
        }
      } catch {
        /* fall through to demo */
      }
      // 3) Offline → demo mode
      await demoLogin(true);
    }
  };

  const handleDemoSelect = (id: string) => {
    const account = demoAccounts.find((a) => a.id === id);
    if (!account) return;
    setSelectedId(id);
    setPhone(account.phone);
    setPin(DEMO_PIN);
    toast.success(`${account.name} — ${account.role}`, {
      description: 'Phone and PIN filled in (123456). Tap Sign In to continue.',
    });
  };

  const pinComplete = pin.length === 6;

  // Format phone number input
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  // Format phone display
  const formatPhoneDisplay = (digits: string) => {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* ===== LEFT PANEL — premium emerald brand (desktop only) ===== */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:w-[460px] xl:w-[520px] xl:p-14">
        {/* Ambient gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-950" />
        <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-emerald-400/10 blur-3xl" />
        {/* Ghana flag ribbon accent */}
        <div className="absolute inset-x-0 top-0 h-1 ghana-accent opacity-90" />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' as const }}
            className="flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/25">
              <Landmark className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">iSusuPro</h1>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">Susu &amp; Microfinance</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' as const }}
            className="mt-10 max-w-sm text-2xl font-semibold leading-snug tracking-tight xl:text-[1.7rem]"
          >
            Empowering Ghanaian communities through inclusive finance.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease: 'easeOut' as const }}
            className="mt-3 max-w-sm text-sm leading-relaxed text-white/65"
          >
            Daily susu collections, micro-loans, MoMo floats and BoG-compliant reporting — one platform for branches, agents and their customers.
          </motion.p>

          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.5, ease: 'easeOut' as const }}
            className="mt-10 space-y-4 text-sm"
          >
            {[
              { icon: ShieldCheck, text: 'Licensed by Bank of Ghana — BoG/MFI/2024/001' },
              { icon: Lock, text: 'Bank-grade 256-bit encryption on every transaction' },
              { icon: Smartphone, text: 'MTN MoMo · Telecel Cash · AT Money · USSD *713#' },
              { icon: Users, text: 'Built for susu groups, agents and branch teams' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 ring-1 ring-emerald-300/15">
                  <Icon className="h-4 w-4 text-emerald-300" />
                </span>
                {text}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6"
        >
          {[
            { value: '50k+', label: 'Members' },
            { value: '₵12M+', label: 'Monthly susu volume' },
            { value: '16', label: 'Regions covered' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold tracking-tight text-emerald-300">{stat.value}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-white/50">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </aside>

      {/* ===== RIGHT PANEL — login form ===== */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/30 px-4 py-8 dark:from-background dark:via-emerald-950/10 dark:to-amber-950/10 sm:px-6 lg:px-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center"
        >
          {/* Compact mobile brand header */}
          <motion.div variants={itemVariants} className="mb-6 lg:hidden">
            <div className="ghana-accent mx-auto w-16 rounded-full" />
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 shadow-md shadow-emerald-600/25">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight text-emerald-900 dark:text-emerald-300">iSusuPro</h1>
                <p className="text-[11px] leading-tight text-muted-foreground">Susu &amp; Microfinance Platform</p>
              </div>
            </div>
          </motion.div>

          {/* Login card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-border/80 py-6 shadow-xl shadow-emerald-900/5 sm:py-7 dark:bg-card dark:shadow-none">
              <div className="px-5 sm:px-7">
                <h2 className="text-xl font-bold tracking-tight text-emerald-950 dark:text-foreground sm:text-2xl">
                  Welcome back
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to your iSusuPro account to continue
                </p>

                {/* Phone Number with +233 prefix */}
                <motion.div variants={formFieldVariants} className="mt-6 space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="flex items-center gap-0 rounded-xl border border-input bg-background transition-colors focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/40">
                    <div className="flex h-11 items-center gap-1.5 border-r border-input bg-muted/50 px-3">
                      <span className="text-base leading-none">🇬🇭</span>
                      <span className="text-sm font-semibold text-foreground">+233</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="24 123 4567"
                      value={formatPhoneDisplay(phone)}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="h-11 flex-1 rounded-none border-0 text-base shadow-none focus-visible:ring-0"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                    <div className="pr-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>

                {/* PIN with individual digit boxes */}
                <motion.div variants={formFieldVariants} className="mt-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Lock className="h-3.5 w-3.5" />
                      6-Digit PIN
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={pin}
                      onChange={setPin}
                      className="gap-2 sm:gap-2.5"
                      type={showPin ? 'text' : 'password'}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2].map((i) => (
                          <InputOTPSlot key={i} index={i} className="h-11 w-9 rounded-lg text-base font-semibold sm:w-10" />
                        ))}
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        {[3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} className="h-11 w-9 rounded-lg text-base font-semibold sm:w-10" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </motion.div>

                {/* Remember me + forgot PIN */}
                <motion.div variants={formFieldVariants} className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch id="remember-me" checked={rememberMe} onCheckedChange={setRememberMe} />
                    <Label htmlFor="remember-me" className="cursor-pointer text-xs text-muted-foreground sm:text-sm">
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 hover:underline sm:text-sm dark:text-emerald-400"
                    onClick={() => toast.info('PIN Reset', {
                      description: 'A PIN reset link has been sent to your registered phone number.',
                    })}
                  >
                    Forgot PIN?
                  </button>
                </motion.div>

                {/* Login Button */}
                <motion.div variants={formFieldVariants} className="mt-6">
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading || !phone.trim() || !pinComplete}
                    className="h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/40 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Demo accounts dropdown */}
          <motion.div variants={itemVariants} className="mt-6">
            <Card className="rounded-2xl border-border/80 py-5 shadow-sm sm:py-6 dark:bg-card">
              <div className="px-5 sm:px-7">
                <div className="flex items-center justify-between gap-3">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold">
                    <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Explore a demo account
                  </Label>
                  <span className="rounded-md border bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    PIN {DEMO_PIN}
                  </span>
                </div>

                <Select value={selectedId} onValueChange={handleDemoSelect}>
                  <SelectTrigger className="mt-3 h-12 w-full rounded-xl text-left">
                    <SelectValue placeholder="Choose a demo account" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[320px]">
                    <SelectGroup>
                      <SelectLabel>Customer &amp; community · live API</SelectLabel>
                      {communityAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="py-2.5">
                          <DemoAccountOption account={account} />
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Branch &amp; head office</SelectLabel>
                      {staffAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="py-2.5">
                          <DemoAccountOption account={account} />
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Selecting an account fills in the phone number and PIN automatically — then tap{' '}
                  <span className="font-medium text-foreground">Sign In</span> to open that portal.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-8 pb-2 text-center">
            <Separator className="mx-auto mb-4 w-16" />
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Licensed by Bank of Ghana &bull; BoG/MFI/2024/001
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              Powered by iSusuPro &copy; {new Date().getFullYear()}
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
