'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Plus,
  Utensils,
  Car,
  Zap,
  Smartphone,
  Film,
  HeartPulse,
  PiggyBank,
  Book,
  Shirt,
  Users,
  Church,
  MoreHorizontal,
  Home,
  RotateCcw,
  CalendarDays,
  Filter,
  Receipt,
  BarChart3,
  CircleDollarSign,
} from 'lucide-react';
import { useCustomerExtendedStore } from '@/store/app-store';
import type { BudgetCategory } from '@/lib/types';

// ---- Icon Mapping ----
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  car: Car,
  zap: Zap,
  smartphone: Smartphone,
  film: Film,
  'heart-pulse': HeartPulse,
  'piggy-bank': PiggyBank,
  book: Book,
  shirt: Shirt,
  users: Users,
  church: Church,
  more: MoreHorizontal,
};

// ---- Category Config ----
const categoryOptions: { value: BudgetCategory; label: string; color: string; icon: string }[] = [
  { value: 'food', label: 'Food', color: '#f97316', icon: 'utensils' },
  { value: 'transport', label: 'Transport', color: '#3b82f6', icon: 'car' },
  { value: 'utilities', label: 'Utilities', color: '#eab308', icon: 'zap' },
  { value: 'rent', label: 'Rent', color: '#8b5cf6', icon: 'home' },
  { value: 'healthcare', label: 'Healthcare', color: '#ef4444', icon: 'heart-pulse' },
  { value: 'education', label: 'Education', color: '#06b6d4', icon: 'book' },
  { value: 'entertainment', label: 'Entertainment', color: '#ec4899', icon: 'film' },
  { value: 'savings', label: 'Savings', color: '#22c55e', icon: 'piggy-bank' },
  { value: 'airtime_data', label: 'Airtime & Data', color: '#f59e0b', icon: 'smartphone' },
  { value: 'clothing', label: 'Clothing', color: '#14b8a6', icon: 'shirt' },
  { value: 'family', label: 'Family', color: '#6366f1', icon: 'users' },
  { value: 'religious', label: 'Religious', color: '#a855f7', icon: 'church' },
  { value: 'other', label: 'Other', color: '#78716c', icon: 'more' },
];

// ---- Formatters ----
const formatCurrency = (amount: number) =>
  `₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });

const getCategoryColor = (category: BudgetCategory) =>
  categoryOptions.find((c) => c.value === category)?.color || '#78716c';

const getCategoryIcon = (icon: string) => iconMap[icon] || MoreHorizontal;

// ---- Animation Variants ----
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ---- Custom Tooltip ----
interface TooltipPayloadItem {
  name: string;
  value: number;
  payload?: { name: string; amount: number };
  color: string;
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-lg">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

// ============================================
// MAIN COMPONENT
// ============================================
export function CustomerBudgeting() {
  const { budgets, expenses, addBudget, addExpense } = useCustomerExtendedStore();

  // ---- State ----
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState<BudgetCategory | ''>('');
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newBudgetPeriod, setNewBudgetPeriod] = useState<'weekly' | 'monthly'>('monthly');

  // Expense form
  const [expenseCategory, setExpenseCategory] = useState<BudgetCategory | ''>('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseLocation, setExpenseLocation] = useState('');
  const [expenseRecurring, setExpenseRecurring] = useState(false);
  const [expenseFrequency, setExpenseFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // History filter
  const [historyFilter, setHistoryFilter] = useState<BudgetCategory | 'all'>('all');

  // ---- Computed Stats ----
  const totalBudget = useMemo(() => budgets.reduce((s, b) => s + b.allocatedAmount, 0), [budgets]);
  const totalSpent = useMemo(() => budgets.reduce((s, b) => s + b.spentAmount, 0), [budgets]);
  const remaining = totalBudget - totalSpent;
  const overBudgetCount = useMemo(() => budgets.filter((b) => b.remainingAmount < 0).length, [budgets]);

  // ---- Pie Chart Data ----
  const pieData = useMemo(
    () =>
      budgets
        .filter((b) => b.spentAmount > 0)
        .map((b) => ({ name: b.categoryName, value: b.spentAmount, color: b.color })),
    [budgets]
  );

  // ---- Bar Chart Data (daily spending this month) ----
  const barData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyMap: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) dailyMap[d] = 0;

    expenses.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        dailyMap[day] = (dailyMap[day] || 0) + e.amount;
      }
    });

    return Object.entries(dailyMap).map(([day, amount]) => ({
      name: `${parseInt(day)}`,
      amount,
    }));
  }, [expenses]);

  // ---- Spending Trends Stats ----
  const trendStats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysPassed = Math.min(now.getDate(), daysInMonth);

    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalMonthSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const avgDaily = daysPassed > 0 ? totalMonthSpent / daysPassed : 0;

    // Highest spend day
    const dailyTotals: Record<number, number> = {};
    monthExpenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      dailyTotals[day] = (dailyTotals[day] || 0) + e.amount;
    });
    let highestDay = 0;
    let highestAmount = 0;
    Object.entries(dailyTotals).forEach(([day, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestDay = parseInt(day);
      }
    });

    // Most expensive category
    const catTotals: Record<string, { total: number; name: string }> = {};
    monthExpenses.forEach((e) => {
      if (!catTotals[e.category]) {
        catTotals[e.category] = { total: 0, name: e.categoryName };
      }
      catTotals[e.category].total += e.amount;
    });
    let expensiveCategory = 'N/A';
    let expensiveCategoryAmount = 0;
    Object.values(catTotals).forEach((ct) => {
      if (ct.total > expensiveCategoryAmount) {
        expensiveCategoryAmount = ct.total;
        expensiveCategory = ct.name;
      }
    });

    return { avgDaily, highestDay, highestAmount, expensiveCategory, expensiveCategoryAmount, totalMonthSpent };
  }, [expenses]);

  // ---- Filtered History ----
  const filteredExpenses = useMemo(
    () =>
      historyFilter === 'all'
        ? expenses
        : expenses.filter((e) => e.category === historyFilter),
    [expenses, historyFilter]
  );

  // ---- Recent Expenses ----
  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

  // ---- Handlers ----
  const handleAddBudget = () => {
    if (!newBudgetCategory || !newBudgetAmount) return;
    const catConfig = categoryOptions.find((c) => c.value === newBudgetCategory);
    const now = new Date();
    const endDate = new Date(now);
    if (newBudgetPeriod === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setDate(endDate.getDate() + 7);
    }
    addBudget({
      category: newBudgetCategory,
      categoryName: catConfig?.label || newBudgetName || newBudgetCategory,
      allocatedAmount: parseFloat(newBudgetAmount),
      spentAmount: 0,
      period: newBudgetPeriod,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      color: catConfig?.color || '#78716c',
      icon: catConfig?.icon || 'more',
    });
    setAddBudgetOpen(false);
    setNewBudgetCategory('');
    setNewBudgetName('');
    setNewBudgetAmount('');
    setNewBudgetPeriod('monthly');
  };

  const handleAddExpense = () => {
    if (!expenseCategory || !expenseAmount || !expenseDescription) return;
    const catConfig = categoryOptions.find((c) => c.value === expenseCategory);
    addExpense({
      category: expenseCategory,
      categoryName: catConfig?.label || expenseCategory,
      amount: parseFloat(expenseAmount),
      description: expenseDescription,
      date: new Date(expenseDate).toISOString(),
      location: expenseLocation || undefined,
      recurring: expenseRecurring,
      recurringFrequency: expenseRecurring ? expenseFrequency : undefined,
    });
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseLocation('');
    setExpenseRecurring(false);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget & Expenses</h1>
          <p className="text-muted-foreground">Track your spending and manage budgets</p>
        </div>
        <Button onClick={() => setAddBudgetOpen(true)} className="w-fit gap-2">
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {/* ---- Summary Stats ---- */}
      <motion.div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
              <Wallet className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-rose-600' : ''}`}>
                {formatCurrency(remaining)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Over Budget</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${overBudgetCount > 0 ? 'text-rose-600' : ''}`}>
                {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ---- Main Tabs ---- */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <CircleDollarSign className="h-4 w-4 hidden sm:block" />
            Budget Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4 hidden sm:block" />
            Add Expense
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4 hidden sm:block" />
            Spending Trends
          </TabsTrigger>
        </TabsList>

        {/* ========== BUDGET OVERVIEW TAB ========== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Budget Cards Grid */}
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {budgets.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <PiggyBank className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No budgets yet. Click &quot;Add Budget&quot; to get started.</p>
              </div>
            )}
            {budgets.map((budget) => {
              const IconComp = getCategoryIcon(budget.icon);
              const percentage = budget.allocatedAmount > 0
                ? Math.min((budget.spentAmount / budget.allocatedAmount) * 100, 100)
                : 0;
              const isOverBudget = budget.remainingAmount < 0;

              return (
                <motion.div key={budget.id} variants={item}>
                  <Card className={`relative overflow-hidden transition-shadow hover:shadow-md ${isOverBudget ? 'border-rose-200 dark:border-rose-800' : ''}`}>
                    <CardContent className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${budget.color}18` }}
                          >
                            <IconComp className="h-5 w-5" style={{ color: budget.color }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{budget.categoryName}</p>
                            <Badge variant="secondary" className="mt-0.5 text-[10px] uppercase tracking-wider">
                              {budget.period}
                            </Badge>
                          </div>
                        </div>
                        {isOverBudget && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                          </motion.div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(0)}% spent</span>
                          <span className={isOverBudget ? 'text-rose-600 font-semibold' : ''}>
                            {formatCurrency(budget.remainingAmount)} left
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-2.5"
                        />
                      </div>

                      {/* Amounts */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-md bg-muted/50 px-2 py-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Allocated</p>
                          <p className="text-sm font-semibold">{formatCurrency(budget.allocatedAmount)}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-2 py-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Spent</p>
                          <p className="text-sm font-semibold">{formatCurrency(budget.spentAmount)}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-2 py-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</p>
                          <p className={`text-sm font-semibold ${isOverBudget ? 'text-rose-600' : ''}`}>
                            {formatCurrency(budget.remainingAmount)}
                          </p>
                        </div>
                      </div>

                      {isOverBudget && (
                        <motion.p
                          className="text-xs text-rose-600 font-medium text-center"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          Over budget by {formatCurrency(Math.abs(budget.remainingAmount))}
                        </motion.p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spending Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-6 lg:flex-row">
                    <div className="w-full max-w-[320px] aspect-square">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={110}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
                      {pieData.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="truncate text-muted-foreground">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* ========== ADD EXPENSE TAB ========== */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Log New Expense</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="exp-category">Category</Label>
                    <Select
                      value={expenseCategory}
                      onValueChange={(v) => setExpenseCategory(v as BudgetCategory)}
                    >
                      <SelectTrigger id="exp-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="exp-amount">Amount (₵)</Label>
                    <Input
                      id="exp-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="exp-desc">Description</Label>
                    <Input
                      id="exp-desc"
                      placeholder="What did you spend on?"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="exp-date">Date</Label>
                    <Input
                      id="exp-date"
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="exp-location">Location (optional)</Label>
                    <Input
                      id="exp-location"
                      placeholder="Where did you spend?"
                      value={expenseLocation}
                      onChange={(e) => setExpenseLocation(e.target.value)}
                    />
                  </div>

                  {/* Recurring */}
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="exp-recurring" className="cursor-pointer">Recurring Expense</Label>
                    </div>
                    <Switch
                      id="exp-recurring"
                      checked={expenseRecurring}
                      onCheckedChange={setExpenseRecurring}
                    />
                  </div>

                  {expenseRecurring && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select value={expenseFrequency} onValueChange={(v) => setExpenseFrequency(v as 'daily' | 'weekly' | 'monthly')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleAddExpense}
                    className="w-full gap-2"
                    disabled={!expenseCategory || !expenseAmount || !expenseDescription}
                  >
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Expenses */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentExpenses.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Receipt className="mx-auto h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">No expenses recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentExpenses.map((exp) => {
                        const catColor = getCategoryColor(exp.category);
                        return (
                          <div
                            key={exp.id}
                            className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm truncate">{exp.description}</p>
                                {exp.recurring && (
                                  <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                                    <RotateCcw className="h-2.5 w-2.5" />
                                    {exp.recurringFrequency}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  className="text-[10px]"
                                  style={{ backgroundColor: `${catColor}18`, color: catColor, border: `${catColor}30` }}
                                >
                                  {exp.categoryName}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{formatDate(exp.date)}</span>
                                {exp.location && (
                                  <span className="text-xs text-muted-foreground truncate">{exp.location}</span>
                                )}
                              </div>
                            </div>
                            <p className="font-semibold text-sm shrink-0">{formatCurrency(exp.amount)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ========== SPENDING TRENDS TAB ========== */}
        <TabsContent value="trends" className="space-y-6">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">
                    Daily Spending - {new Date().toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval={Math.floor(barData.length / 15)}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `₵${v}`}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="amount"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trend Stats */}
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item}>
              <Card>
                <CardContent className="p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Total</p>
                  <p className="text-xl font-bold">{formatCurrency(trendStats.totalMonthSpent)}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card>
                <CardContent className="p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg. Daily Spend</p>
                  <p className="text-xl font-bold">{formatCurrency(trendStats.avgDaily)}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card>
                <CardContent className="p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Highest Spend Day</p>
                  <p className="text-xl font-bold">{trendStats.highestDay > 0 ? `${trendStats.highestDay}${trendStats.highestDay === 1 ? 'st' : trendStats.highestDay === 2 ? 'nd' : trendStats.highestDay === 3 ? 'rd' : 'th'}` : 'N/A'}</p>
                  {trendStats.highestAmount > 0 && (
                    <p className="text-xs text-muted-foreground">{formatCurrency(trendStats.highestAmount)}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card>
                <CardContent className="p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Category</p>
                  <p className="text-xl font-bold truncate">{trendStats.expensiveCategory}</p>
                  {trendStats.expensiveCategoryAmount > 0 && (
                    <p className="text-xs text-muted-foreground">{formatCurrency(trendStats.expensiveCategoryAmount)}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* ---- Expense History ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Expense History</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={historyFilter} onValueChange={(v) => setHistoryFilter(v as BudgetCategory | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Recurring</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No expenses found
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const catColor = getCategoryColor(exp.category);
                      return (
                        <tr key={exp.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDate(exp.date)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className="text-[10px]"
                              style={{ backgroundColor: `${catColor}18`, color: catColor, border: `${catColor}30` }}
                            >
                              {exp.categoryName}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate">
                            {exp.description}
                            {exp.location && (
                              <span className="text-xs text-muted-foreground ml-1">({exp.location})</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {exp.recurring ? (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <RotateCcw className="h-2.5 w-2.5" />
                                {exp.recurringFrequency}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Add Budget Dialog ---- */}
      <Dialog open={addBudgetOpen} onOpenChange={setAddBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newBudgetCategory}
                onValueChange={(v) => {
                  setNewBudgetCategory(v as BudgetCategory);
                  const cat = categoryOptions.find((c) => c.value === v);
                  setNewBudgetName(cat?.label || '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-name">Budget Name</Label>
              <Input
                id="budget-name"
                placeholder="e.g. Monthly Groceries"
                value={newBudgetName}
                onChange={(e) => setNewBudgetName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-amount">Allocated Amount (₵)</Label>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={newBudgetPeriod} onValueChange={(v) => setNewBudgetPeriod(v as 'weekly' | 'monthly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setAddBudgetOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleAddBudget}
                disabled={!newBudgetCategory || !newBudgetAmount}
              >
                <Plus className="h-4 w-4" />
                Create Budget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
