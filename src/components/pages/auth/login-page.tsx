'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, LayoutDashboard, PiggyBank, Building2,
  Phone, Lock, ArrowRight, Landmark, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP } from '@/components/ui/input-otp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNavigationStore } from '@/store/app-store';
import type { PortalId } from '@/lib/types';

// ---- Portal card data ----
const portals: {
  id: PortalId;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  hoverBorder: string;
}[] = [
  {
    id: 'customer',
    title: 'Customer Portal',
    description: 'Manage your susu, loans, and wallet',
    icon: Wallet,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    hoverBorder: 'hover:border-emerald-300',
  },
  {
    id: 'agent',
    title: 'Agent Portal',
    description: 'Collect contributions and manage customers',
    icon: Building2,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    hoverBorder: 'hover:border-blue-300',
  },
  {
    id: 'admin',
    title: 'Admin Portal',
    description: 'System administration and analytics',
    icon: LayoutDashboard,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    hoverBorder: 'hover:border-amber-300',
  },
  {
    id: 'treasurer',
    title: 'Treasurer Portal',
    description: 'Manage group susu and payouts',
    icon: PiggyBank,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    hoverBorder: 'hover:border-purple-300',
  },
];

// ---- Animation variants ----
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ---- Component ----
export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setPortal = useNavigationStore((s) => s.setPortal);

  const handleLogin = async () => {
    setIsLoading(true);
    // Simulate login — default to customer portal
    setTimeout(() => {
      setPortal('customer');
      setIsLoading(false);
    }, 800);
  };

  const handlePortalLaunch = (portalId: PortalId) => {
    setPortal(portalId);
  };

  const pinComplete = pin.length === 6;

  return (
    <div className="flex min-h-screen w-full">
      {/* ===== LEFT PANEL — Ghana-inspired brand (hidden on mobile) ===== */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden lg:flex lg:w-[480px] xl:w-[520px]">
        {/* Background with Ghana flag stripe accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-yellow-500 via-40% to-emerald-700" />

        {/* Subtle flag stripe overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-1/3 w-full bg-red-600" />
          <div className="h-1/3 w-full bg-yellow-400" />
          <div className="h-1/3 w-full bg-emerald-600" />
        </div>

        {/* Decorative dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/5" />

        {/* Content */}
        <div className="relative z-10 flex max-w-md flex-col items-center gap-6 px-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm"
          >
            <Landmark className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-bold tracking-tight text-white"
          >
            SusuPay
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg leading-relaxed text-white/85"
          >
            Empowering Ghanaian Communities Through Inclusive Finance
          </motion.p>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-4 flex items-center gap-6 text-sm text-white/70"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Bank-grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>50k+ Members</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Login form + Portal selection ===== */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/20 px-4 py-8 sm:px-6 lg:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-lg"
        >
          {/* Mobile-only brand header */}
          <motion.div variants={itemVariants} className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
              <Landmark className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-800">SusuPay</h1>
            <p className="text-center text-sm text-muted-foreground">
              Empowering Ghanaian Communities Through Inclusive Finance
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-xl shadow-emerald-900/5">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-emerald-900">Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your SusuPay account to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Phone Number
                  </Label>
                  <div className="flex items-center gap-0 rounded-lg border border-slate-200 bg-white focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                    <span className="flex h-10 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500">
                      +233
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="24 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 flex-1 border-0 shadow-none focus-visible:ring-0"
                    />
                    <div className="pr-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* PIN */}
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-sm font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      6-Digit PIN
                    </span>
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={pin}
                      onChange={setPin}
                      className="gap-2"
                    />
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  onClick={handleLogin}
                  disabled={isLoading || !phone.trim() || !pinComplete}
                  className="h-11 w-full bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/40 active:scale-[0.98] disabled:opacity-50"
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

                {/* Forgot PIN */}
                <p className="text-center text-sm text-muted-foreground">
                  Forgot your PIN?{' '}
                  <button className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                    Reset it here
                  </button>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Divider with Portal Selection */}
          <motion.div variants={itemVariants} className="mt-8">
            <div className="mb-6 flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Or select a portal to demo
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Portal Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {portals.map((portal) => {
                const Icon = portal.icon;
                return (
                  <motion.div
                    key={portal.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card
                      className={`group cursor-pointer border-slate-200 bg-white py-0 transition-shadow hover:shadow-lg hover:shadow-slate-900/5 ${portal.hoverBorder}`}
                      onClick={() => handlePortalLaunch(portal.id)}
                    >
                      <CardContent className="flex flex-col items-start gap-3 p-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${portal.iconBg} transition-transform group-hover:scale-110`}
                        >
                          <Icon className={`h-5 w-5 ${portal.iconColor}`} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-slate-800">
                            {portal.title}
                          </h3>
                          <p className="text-xs leading-relaxed text-slate-500">
                            {portal.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-8 gap-1 px-3 text-xs font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Launch Portal
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-8 text-center text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Licensed by Bank of Ghana &bull; BoG/MFI/2024/001
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
