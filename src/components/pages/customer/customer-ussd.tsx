'use client';

import { useState } from 'react';
import { formatGHS } from '@/lib/formatters';
import { useCustomerStore } from '@/store/app-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Hash, Phone, Delete, Send, Landmark, PiggyBank, Wallet, Receipt } from 'lucide-react';

// USSD menu tree for *713# — mirrors the NestJS USSD gateway contract
type UssdScreen = 'main' | 'susu' | 'wallet' | 'loans' | 'bills' | 'done';

const MAIN_MENU = [
  { key: '1', label: 'My Susu (Daily Savings)', screen: 'susu' as const, icon: PiggyBank },
  { key: '2', label: 'Wallet — Deposit / Withdraw', screen: 'wallet' as const, icon: Wallet },
  { key: '3', label: 'Loans — Apply / Repay', screen: 'loans' as const, icon: Landmark },
  { key: '4', label: 'Pay Bills (ECG, Water, DSTV)', screen: 'bills' as const, icon: Receipt },
  { key: '5', label: 'Mini Statement (last 3)', screen: 'done' as const, icon: Receipt },
];

export function CustomerUssd() {
  const { wallets, susuGroups } = useCustomerStore();
  const mainWallet = wallets[0];
  const [phone, setPhone] = useState('024 400 1290');
  const [dialed, setDialed] = useState(false);
  const [screen, setScreen] = useState<UssdScreen>('main');
  const [input, setInput] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const totalSavings = susuGroups.reduce((s, g) => s + g.totalPool, 0);

  const dial = () => {
    setDialed(true);
    setScreen('main');
    setLog(['iSusuPro — welcome! Choose an option:']);
  };

  const choose = (key: string) => {
    const item = MAIN_MENU.find(m => m.key === key);
    if (!item) return;
    setLog(l => [...l, `> ${key}`, item.label]);
    setScreen(item.screen);
    if (item.screen === 'done') {
      setLog(l => [...l,
        `1. Susu contribution ₵50.00 — Makola Group`,
        `2. Airtime MTN ₵10.00`,
        `3. Wallet deposit ₵200.00 MoMo`,
        'Dial *713*0# for full statement',
      ]);
    }
  };

  const submitAmount = (purpose: string) => {
    const amt = Number(input);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLog(l => [...l, `> ${amt}`, `${purpose} of ${formatGHS(amt)} successful. Ref USSD${Math.floor(100000 + Math.random() * 899999)}. SMS confirmation sent.`]);
    setInput('');
    setScreen('done');
    toast.success(`${purpose} successful`, { description: `${formatGHS(amt)} — SMS confirmation sent to ${phone}` });
  };

  const press = (k: string) => {
    if (screen === 'main') { choose(k); setInput(''); return; }
    if (screen === 'done') { setScreen('main'); setLog(l => [...l, '> 0', 'Main menu']); return; }
    if (input.length < 8) setInput(v => v + k);
  };

  const screens: Record<UssdScreen, { title: string; lines: string[]; hint: string }> = {
    main: { title: 'iSusuPro Menu', lines: MAIN_MENU.map(m => `${m.key}. ${m.label}`), hint: 'Press a number' },
    susu: {
      title: 'My Susu',
      lines: [`Total savings: ${formatGHS(totalSavings)}`, 'Groups: ' + susuGroups.length, '1. Contribute to today', '2. Check balance', '0. Back'],
      hint: '1 to contribute',
    },
    wallet: {
      title: 'Wallet',
      lines: [`Balance: ${formatGHS(mainWallet?.balance ?? 0)}`, '1. Deposit from MoMo', '2. Withdraw to MoMo', '0. Back'],
      hint: '1 deposit · 2 withdraw',
    },
    loans: {
      title: 'Loans',
      lines: ['1. Check my eligibility', '2. Repay loan', '3. Talk to Loan Officer', '0. Back'],
      hint: 'Press a number',
    },
    bills: {
      title: 'Pay Bills',
      lines: ['1. ECG Electricity', '2. Ghana Water', '3. DSTV / GOtv', '0. Back'],
      hint: 'Press a number',
    },
    done: { title: 'Result', lines: [], hint: 'Press 0 for main menu' },
  };

  const current = screens[screen];
  const isAmountEntry = (screen === 'susu' && input !== '' && Number(input) > 0) || (screen === 'wallet' && input !== '' && Number(input) > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-l-4 border-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
            USSD Channel — *713#
          </CardTitle>
          <CardDescription>
            Works on every phone — no internet needed. Nokia 3310 to iPhone, all Ghanaians bank with iSusuPro.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs">
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">No data bundle needed</Badge>
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Works on MTN · Telecel · AT</Badge>
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Available in Twi, Ga, Ewe, Hausa & English</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Phone simulator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Try It — Feature Phone Simulator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dialer */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 w-full rounded-md border bg-background pl-9 text-sm"
                  placeholder="Phone number"
                />
              </div>
              <Button className="min-h-[44px] bg-green-600 hover:bg-green-700 touch-manipulation" onClick={dial} disabled={dialed}>
                <Hash className="mr-1 h-4 w-4" />713# Call
              </Button>
            </div>

            {/* Phone screen */}
            <motion.div layout className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-4 border-zinc-800 bg-zinc-900 shadow-xl dark:border-zinc-700">
              {/* Notch */}
              <div className="flex items-center justify-between bg-zinc-900 px-6 pt-2 text-[9px] text-zinc-500">
                <span>MTN GH</span>
                <span>▮▮▮ 12:45</span>
              </div>
              <div className="min-h-[220px] bg-lime-50 p-3 font-mono text-[11px] leading-relaxed text-zinc-900 dark:bg-zinc-950 dark:text-lime-200">
                <AnimatePresence mode="wait">
                  {!dialed ? (
                    <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-16 text-center text-zinc-400 dark:text-zinc-500">
                      No service dialed
                    </motion.p>
                  ) : (
                    <motion.div key={screen} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <p className="mb-1 border-b border-lime-300 pb-1 font-bold dark:border-lime-800">{current.title}</p>
                      {current.lines.map((line, i) => <p key={i}>{line}</p>)}
                      {screen === 'done' && log.slice(-6).map((l, i) => <p key={`l${i}`} className={l.startsWith('>') ? 'font-bold' : ''}>{l}</p>)}
                      {input && screen !== 'main' && screen !== 'done' && <p className="mt-1 text-blue-700 dark:text-blue-300">Amount: ₵{input}</p>}
                      <p className="mt-2 border-t border-lime-300 pt-1 text-[10px] text-zinc-500 dark:border-lime-800">{current.hint}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Keypad */}
              <div className="grid grid-cols-3 gap-1.5 bg-zinc-900 p-3 dark:bg-zinc-900">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => (
                  <button
                    key={k}
                    onClick={() => press(k)}
                    disabled={!dialed}
                    className="h-10 rounded-lg bg-zinc-800 font-mono text-sm font-bold text-zinc-100 transition-colors hover:bg-zinc-700 active:scale-95 disabled:opacity-40 dark:bg-zinc-800"
                  >
                    {k}
                  </button>
                ))}
                <div className="col-span-2 flex gap-1.5">
                  <button onClick={() => setInput(v => v.slice(0, -1))} className="h-10 flex-1 rounded-lg bg-zinc-800 text-zinc-100 active:scale-95 dark:bg-zinc-800" aria-label="Delete">
                    <Delete className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (isAmountEntry) {
                        submitAmount(screen === 'susu' ? 'Susu contribution' : 'Wallet deposit');
                      } else if (screen !== 'main' && screen !== 'done' && input) {
                        const opt = screens[screen].lines.find(l => l.startsWith(input));
                        if (opt) setLog(l => [...l, `> ${input}`, opt.replace(/^\d\.\s/, '')]);
                        setInput('');
                      }
                    }}
                    className="h-10 flex-1 rounded-lg bg-green-600 text-white active:scale-95"
                    aria-label="Send"
                  >
                    <Send className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* How it works + code list */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">USSD Short Codes</CardTitle>
              <CardDescription>Share these with customers on feature phones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-sm">
              {[
                ['*713#', 'Main menu'],
                ['*713*1*amount#', 'Quick susu contribution'],
                ['*713*2*amount#', 'Wallet deposit via MoMo'],
                ['*713*3#', 'Loan eligibility & repayment'],
                ['*713*4#', 'Pay bills (ECG, water, TV)'],
                ['*713*0#', 'Full mini statement'],
              ].map(([code, desc]) => (
                <div key={code} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="font-bold text-green-700 dark:text-green-400">{code}</span>
                  <span className="font-sans text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Financial inclusion in Ghana</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                About 4 in 10 rural Ghanaians still use feature phones. USSD is the bridge that lets market women at Makola, farmers in Techiman and kayayei in Accra save daily without a smartphone, app or data bundle. Every *713# session is charged by the telco at ~Gp5 — iSusuPro waives the fee for susu contributions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
