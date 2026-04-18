'use client';

import { useState, useMemo } from 'react';
import { useCustomerExtendedStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor } from '@/lib/formatters';
import type { TelcoProvider, AirtimeProduct } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Smartphone,
  Zap,
  Wifi,
  Package,
  Clock,
  Check,
  Phone,
  User,
  Star,
  History,
  Shield,
  Send,
  Sparkles,
} from 'lucide-react';

// ============================================
// Telco Provider Config
// ============================================
const providerConfig = {
  mtn: { name: 'MTN', color: '#FFC300', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-400', textColor: 'text-yellow-700' },
  telecel: { name: 'Telecel', color: '#E60000', bgColor: 'bg-red-50', borderColor: 'border-red-400', textColor: 'text-red-700' },
  atum: { name: 'AT', color: '#0072FF', bgColor: 'bg-blue-50', borderColor: 'border-blue-400', textColor: 'text-blue-700' },
} as const;

// ============================================
// Quick Amount Buttons (for airtime)
// ============================================
const quickAmounts = [1, 5, 10, 20, 50, 100] as const;

// ============================================
// Animation Variants
// ============================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const productCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.35,
      ease: 'easeOut',
    },
  }),
};

// ============================================
// Status icon helper
// ============================================
function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <Check className="h-3 w-3" />;
    case 'processing':
      return <Clock className="h-3 w-3" />;
    case 'pending':
      return <Clock className="h-3 w-3" />;
    case 'failed':
      return <span className="text-[10px] font-bold">✕</span>;
    default:
      return null;
  }
}

// ============================================
// Main Component
// ============================================
export function CustomerAirtime() {
  const { airtimeProducts, airtimeTransactions, purchaseAirtime } =
    useCustomerExtendedStore();

  // ---- Local State ----
  const [selectedProvider, setSelectedProvider] = useState<TelcoProvider | null>(null);
  const [phoneSuffix, setPhoneSuffix] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [activeTab, setActiveTab] = useState<'airtime' | 'data' | 'bundle'>('airtime');
  const [selectedProduct, setSelectedProduct] = useState<AirtimeProduct | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ---- Derived: filtered products ----
  const filteredProducts = useMemo(() => {
    if (!selectedProvider) return [];
    return airtimeProducts.filter(
      (p) => p.provider === selectedProvider && p.type === activeTab
    );
  }, [selectedProvider, activeTab, airtimeProducts]);

  // ---- Recent Transactions (last 5) ----
  const recentTransactions = airtimeTransactions.slice(0, 5);

  // ---- Format full phone ----
  const fullPhone = phoneSuffix.trim()
    ? `+233 ${phoneSuffix.trim()}`
    : '';

  // ---- Can buy check ----
  const canBuy = selectedProvider && fullPhone.length >= 14 && selectedProduct;

  // ---- Handle purchase click ----
  function handleBuyClick() {
    if (!canBuy) {
      if (!selectedProvider) {
        toast.error('Please select a network provider');
      } else if (fullPhone.length < 14) {
        toast.error('Please enter a valid phone number');
      } else if (!selectedProduct) {
        toast.error('Please select a product');
      }
      return;
    }
    setConfirmOpen(true);
  }

  // ---- Handle confirm purchase ----
  function handleConfirmPurchase() {
    if (!selectedProvider || !fullPhone || !selectedProduct) return;
    purchaseAirtime(selectedProvider, fullPhone, selectedProduct.id);
    const providerCfg = providerConfig[selectedProvider];
    toast.success(
      `${selectedProduct.name} purchased for ${fullPhone} via ${providerCfg.name}!`
    );
    setConfirmOpen(false);
    setSelectedProduct(null);
  }

  // ---- Custom airtime amount (not from list) ----
  const hasCustomAirtime = activeTab === 'airtime' && selectedProvider;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ==============================
          Page Header
          ============================== */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Buy Airtime &amp; Data
          </h1>
          <p className="text-sm text-slate-500">
            Instantly top up any network — airtime, data &amp; bundles
          </p>
        </div>
        <Badge className="mt-2 w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100 sm:mt-0">
          {airtimeTransactions.length} Purchases
        </Badge>
      </motion.div>

      {/* ==============================
          Provider Selection
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Smartphone className="h-5 w-5 text-slate-500" />
              Select Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(providerConfig) as [TelcoProvider, typeof providerConfig[TelcoProvider]][]).map(
                ([key, config]) => {
                  const isSelected = selectedProvider === key;
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedProvider(key);
                        setSelectedProduct(null);
                      }}
                      className={`relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all touch-manipulation ${
                        isSelected
                          ? `${config.borderColor} ${config.bgColor} shadow-md`
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && (
                        <div
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
                          style={{ backgroundColor: config.color }}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold shadow-sm"
                        style={{
                          backgroundColor: `${config.color}20`,
                          color: config.color,
                        }}
                      >
                        {config.name === 'MTN' ? 'M' : config.name === 'Telecel' ? 'T' : 'AT'}
                      </div>
                      <div className="text-center">
                        <p
                          className={`text-sm font-bold ${
                            isSelected ? config.textColor : 'text-slate-800'
                          }`}
                        >
                          {config.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {config.name === 'MTN' ? 'Everywhere you go' : config.name === 'Telecel' ? 'Make the connection' : 'Your world, connected'}
                        </p>
                      </div>
                    </motion.button>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ==============================
          Phone Number & Recipient (shown after provider selected)
          ============================== */}
      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Phone className="h-5 w-5 text-slate-500" />
                  Recipient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="airtime-phone">Phone Number</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                      +233
                    </span>
                    <Input
                      id="airtime-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="24 123 4567"
                      value={phoneSuffix}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9\s]/g, '');
                        setPhoneSuffix(val);
                      }}
                      className="pl-14"
                      maxLength={12}
                    />
                  </div>
                </div>

                {/* Recipient Name (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="recipient-name" className="text-slate-500">
                    Recipient Name <span className="text-slate-400">(optional)</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="recipient-name"
                      type="text"
                      placeholder="e.g. Ama Mensah"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==============================
          Tabs: Airtime / Data / Bundles
          ============================== */}
      <AnimatePresence>
        {selectedProvider && fullPhone.length >= 14 && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as 'airtime' | 'data' | 'bundle');
                setSelectedProduct(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                <TabsTrigger value="airtime" className="gap-1.5 text-xs sm:text-sm">
                  <Zap className="h-4 w-4" />
                  Airtime
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-1.5 text-xs sm:text-sm">
                  <Wifi className="h-4 w-4" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="bundle" className="gap-1.5 text-xs sm:text-sm">
                  <Package className="h-4 w-4" />
                  Bundles
                </TabsTrigger>
              </TabsList>

              {/* ==============================
                  AIRTIME TAB
                  ============================== */}
              <TabsContent value="airtime" className="space-y-4">
                {/* Quick Amount Buttons */}
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Quick Amount
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {quickAmounts.map((amt) => {
                        const matchingProduct = filteredProducts.find(
                          (p) => p.price === amt
                        );
                        return (
                          <motion.button
                            key={amt}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (matchingProduct) {
                                setSelectedProduct(matchingProduct);
                              } else {
                                // If no matching product in the list, select it by amount
                                setSelectedProduct({
                                  id: `custom-${amt}`,
                                  provider: selectedProvider!,
                                  name: `${providerConfig[selectedProvider!].name} ₵${amt}`,
                                  type: 'airtime',
                                  description: `GH${amt} Airtime`,
                                  price: amt,
                                  value: amt,
                                  validity: 'Lifetime',
                                  popular: false,
                                });
                              }
                            }}
                            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all touch-manipulation min-h-[44px] ${
                              selectedProduct?.price === amt && selectedProduct?.type === 'airtime'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            ₵{amt}
                          </motion.button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Grid */}
                {filteredProducts.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={i}
                        selected={selectedProduct?.id === product.id}
                        onSelect={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==============================
                  DATA TAB
                  ============================== */}
              <TabsContent value="data" className="space-y-4">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={i}
                        selected={selectedProduct?.id === product.id}
                        onSelect={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Wifi className="h-10 w-10 text-slate-300" />}
                    title="No data plans available"
                    description={`No data plans found for ${providerConfig[selectedProvider].name}. Check back later.`}
                  />
                )}
              </TabsContent>

              {/* ==============================
                  BUNDLES TAB
                  ============================== */}
              <TabsContent value="bundle" className="space-y-4">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={i}
                        selected={selectedProduct?.id === product.id}
                        onSelect={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Package className="h-10 w-10 text-slate-300" />}
                    title="No bundles available"
                    description={`No bundle plans found for ${providerConfig[selectedProvider].name}. Check back later.`}
                  />
                )}
              </TabsContent>
            </Tabs>

            {/* ==============================
                Buy Button
                ============================== */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-slate-200/80 shadow-sm">
                  <div
                    className="h-1.5"
                    style={{
                      backgroundColor:
                        selectedProduct.provider
                          ? providerConfig[selectedProduct.provider].color
                          : '#10b981',
                    }}
                  />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedProduct.name}
                          </p>
                          {selectedProduct.popular && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              <Star className="mr-1 h-3 w-3" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {selectedProduct.description}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {fullPhone}
                          </span>
                          {recipientName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {recipientName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold text-slate-900">
                          {formatGHS(selectedProduct.price)}
                        </p>
                        <Button
                          onClick={handleBuyClick}
                          className="h-12 min-h-[44px] gap-2 bg-emerald-600 px-6 text-white hover:bg-emerald-700"
                          size="lg"
                        >
                          <Send className="h-4 w-4" />
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==============================
          Prompt when no provider selected
          ============================== */}
      {!selectedProvider && (
        <motion.div variants={itemVariants}>
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Smartphone className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-700">
                Select a Network
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Choose your mobile network provider above to see available
                airtime, data and bundle plans.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ==============================
          Recent Transactions
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" />
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Recent Top-ups
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    Your last {recentTransactions.length} transactions
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <History className="h-6 w-6 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No top-ups yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Your airtime & data purchases will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                        Network
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                        Phone
                      </th>
                      <th className="hidden px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 sm:table-cell">
                        Product
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                        Amount
                      </th>
                      <th className="hidden px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 md:table-cell">
                        Date
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentTransactions.map((txn) => {
                      const cfg = providerConfig[txn.provider];
                      return (
                        <motion.tr
                          key={txn.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <Badge
                              className={`${cfg.bgColor} ${cfg.textColor} hover:${cfg.bgColor} border-0 text-xs font-semibold`}
                            >
                              {cfg.name}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {txn.recipientPhone}
                              </p>
                              {txn.recipientName && (
                                <p className="text-xs text-slate-400">
                                  {txn.recipientName}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="hidden whitespace-nowrap px-5 py-3.5 sm:table-cell">
                            <div className="flex items-center gap-2">
                              {txn.type === 'airtime' && (
                                <Zap className="h-3.5 w-3.5 text-amber-500" />
                              )}
                              {txn.type === 'data' && (
                                <Wifi className="h-3.5 w-3.5 text-blue-500" />
                              )}
                              {txn.type === 'bundle' && (
                                <Package className="h-3.5 w-3.5 text-violet-500" />
                              )}
                              <span className="text-sm text-slate-700">
                                {txn.productName}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <span className="text-sm font-semibold text-slate-900">
                              {formatGHS(txn.amount)}
                            </span>
                          </td>
                          <td className="hidden whitespace-nowrap px-5 py-3.5 md:table-cell">
                            <span className="text-sm text-slate-500">
                              {formatDate(txn.date)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <Badge
                              className={`${getStatusColor(txn.status)} flex w-fit items-center gap-1 capitalize`}
                            >
                              {getStatusIcon(txn.status)}
                              {txn.status}
                            </Badge>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ==============================
          Security Info
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Secure &amp; Instant Top-ups
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                All airtime and data purchases are processed instantly through
                secure channels. Your transactions are encrypted and your details
                are never shared with third parties.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ==============================
          Purchase Confirmation Dialog
          ============================== */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-500" />
              Confirm Purchase
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && selectedProvider && (
            <div className="space-y-4 py-2">
              {/* Provider & Network */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: `${providerConfig[selectedProvider].color}20`,
                    color: providerConfig[selectedProvider].color,
                  }}
                >
                  {providerConfig[selectedProvider].name === 'MTN'
                    ? 'M'
                    : providerConfig[selectedProvider].name === 'Telecel'
                      ? 'T'
                      : 'AT'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {providerConfig[selectedProvider].name}
                  </p>
                  <p className="text-xs text-slate-400">{selectedProduct.type} top-up</p>
                </div>
              </div>

              <Separator />

              {/* Phone Number */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Phone Number</span>
                <span className="text-sm font-semibold text-slate-900">
                  {fullPhone}
                </span>
              </div>

              {/* Recipient Name (if provided) */}
              {recipientName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Recipient</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {recipientName}
                  </span>
                </div>
              )}

              {/* Product */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Product</span>
                <span className="text-sm font-semibold text-slate-900">
                  {selectedProduct.name}
                </span>
              </div>

              {/* Validity */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Validity</span>
                <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedProduct.validity}
                </span>
              </div>

              <Separator />

              {/* Total Amount */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-emerald-600">
                  {formatGHS(selectedProduct.price)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPurchase}
              className="min-h-[44px] bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Confirm &amp; Pay {selectedProduct ? formatGHS(selectedProduct.price) : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ============================================
// Product Card Sub-component
// ============================================
function ProductCard({
  product,
  index,
  selected,
  onSelect,
}: {
  product: AirtimeProduct;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const cfg = providerConfig[product.provider];
  return (
    <motion.div
      custom={index}
      variants={productCardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border-2 bg-white p-4 transition-all touch-manipulation ${
        selected
          ? `${cfg.borderColor} ${cfg.bgColor} shadow-md`
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {product.type === 'airtime' && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
          )}
          {product.type === 'data' && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Wifi className="h-4 w-4 text-blue-600" />
            </div>
          )}
          {product.type === 'bundle' && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Package className="h-4 w-4 text-violet-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {product.name}
            </p>
            <p className="text-xs text-slate-400">{product.description}</p>
          </div>
        </div>
        {product.popular && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0">
            <Star className="mr-0.5 h-2.5 w-2.5" />
            Popular
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {product.validity}
        </div>
        <p className="text-lg font-bold text-slate-900">
          {formatGHS(product.price)}
        </p>
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 flex items-center gap-1.5"
        >
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: cfg.color }}
          >
            <Check className="h-3 w-3" />
          </div>
          <span className="text-xs font-medium text-slate-500">Selected</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// Empty State Sub-component
// ============================================
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        {icon}
        <p className="mt-3 text-sm font-semibold text-slate-600">{title}</p>
        <p className="mt-1 max-w-sm text-xs text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}
