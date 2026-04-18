'use client';

import { useState } from 'react';
import { useAdminStore, useConfigStore } from '@/store/app-store';
import { getInitials, formatPhoneGH, formatDate, formatGHS } from '@/lib/formatters';
import { GHANA_REGIONS } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { PaymentGatewayId, SMSProviderId } from '@/lib/types';
import {
  User, Shield, Bell, Lock, Smartphone, Camera, Eye, EyeOff,
  Fingerprint, Globe, Settings, History, Key, AlertTriangle, Copy, RefreshCw,
  Building2, CreditCard, MessageSquare, CheckCircle2, XCircle, Zap,
  ExternalLink, Info, ChevronRight, Radio, QrCode, Wallet,
  Landmark, Mail, Phone, MapPin, FileText, Palette, Languages,
  Send, AlertOctagon, Megaphone, ShieldCheck
} from 'lucide-react';

// =============================================
// MAIN COMPONENT
// =============================================
export function AdminSettings() {
  const { user } = useAdminStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your admin profile, company configuration, integrations, and security
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto lg:w-auto lg:inline-grid lg:grid-cols-5 no-scrollbar">
          <TabsTrigger value="company" className="gap-1.5 min-w-fit text-xs sm:text-sm">
            <Building2 className="h-3.5 w-3.5 hidden sm:block" />
            Company
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 min-w-fit text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5 hidden sm:block" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-1.5 min-w-fit text-xs sm:text-sm">
            <MessageSquare className="h-3.5 w-3.5 hidden sm:block" />
            SMS &amp; OTP
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5 min-w-fit text-xs sm:text-sm">
            <User className="h-3.5 w-3.5 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 min-w-fit text-xs sm:text-sm">
            <Shield className="h-3.5 w-3.5 hidden sm:block" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ============ COMPANY DETAILS TAB ============ */}
        <TabsContent value="company" className="space-y-6">
          <CompanyDetailsTab />
        </TabsContent>

        {/* ============ PAYMENT GATEWAYS TAB ============ */}
        <TabsContent value="payments" className="space-y-6">
          <PaymentGatewaysTab />
        </TabsContent>

        {/* ============ SMS & OTP TAB ============ */}
        <TabsContent value="sms" className="space-y-6">
          <SMSProvidersTab />
        </TabsContent>

        {/* ============ PROFILE TAB ============ */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileTab user={user} />
        </TabsContent>

        {/* ============ SECURITY TAB ============ */}
        <TabsContent value="security" className="space-y-6">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================
// COMPANY DETAILS TAB
// =============================================
function CompanyDetailsTab() {
  const { company, updateCompanyDetails } = useConfigStore();
  const [editingCompany, setEditingCompany] = useState(false);

  // Local form state
  const [form, setForm] = useState({ ...company });

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateCompanyDetails(form);
    setEditingCompany(false);
    toast.success('Company details saved', {
      description: 'Your company information has been updated successfully.',
    });
  };

  const handleCancel = () => {
    setForm({ ...company });
    setEditingCompany(false);
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Your registered business details shown across the platform
              </CardDescription>
            </div>
            {!editingCompany ? (
              <Button variant="outline" size="sm" onClick={() => setEditingCompany(true)}>
                Edit Details
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                <Button size="sm" onClick={handleSave}>Save Changes</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Company Name & Trading Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Registered Company Name</Label>
              {editingCompany ? (
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  placeholder="e.g. iSusuPro Microfinance Ltd."
                  className="h-12"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                  {form.companyName || 'Not configured'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradingName">Trading Name / Brand</Label>
              {editingCompany ? (
                <Input
                  id="tradingName"
                  value={form.tradingName}
                  onChange={(e) => handleFieldChange('tradingName', e.target.value)}
                  placeholder="e.g. iSusuPro"
                  className="h-12"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                  {form.tradingName || 'Not configured'}
                </p>
              )}
            </div>
          </div>

          {/* Registration & Tax */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="regNumber">Company Registration Number</Label>
              {editingCompany ? (
                <Input
                  id="regNumber"
                  value={form.registrationNumber}
                  onChange={(e) => handleFieldChange('registrationNumber', e.target.value)}
                  placeholder="e.g. CS-XXXXXX"
                  className="h-12"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-mono">
                  {form.registrationNumber || 'Not configured'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
              {editingCompany ? (
                <Input
                  id="tin"
                  value={form.taxIdentificationNumber}
                  onChange={(e) => handleFieldChange('taxIdentificationNumber', e.target.value)}
                  placeholder="e.g. C0000000000"
                  className="h-12 font-mono"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-mono">
                  {form.taxIdentificationNumber || 'Not configured'}
                </p>
              )}
            </div>
          </div>

          {/* Company Type & Industry */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Type</Label>
              {editingCompany ? (
                <div className="grid gap-2">
                  {([
                    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
                    { value: 'partnership', label: 'Partnership' },
                    { value: 'limited_liability', label: 'Limited Liability Company' },
                    { value: 'cooperative', label: 'Cooperative Society' },
                    { value: 'ngo', label: 'NGO / Non-Profit' },
                  ] as const).map((ct) => (
                    <div
                      key={ct.value}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors text-sm ${
                        form.companyType === ct.value
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                      onClick={() => handleFieldChange('companyType', ct.value)}
                    >
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        form.companyType === ct.value ? 'border-primary' : 'border-muted-foreground/30'
                      }`}>
                        {form.companyType === ct.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="font-medium">{ct.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm capitalize">
                  {form.companyType.replace('_', ' ')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              {editingCompany ? (
                <Input
                  id="industry"
                  value={form.industry}
                  onChange={(e) => handleFieldChange('industry', e.target.value)}
                  placeholder="e.g. Microfinance"
                  className="h-12"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                  {form.industry}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            {editingCompany ? (
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Brief description of your company..."
                rows={3}
                className="resize-none"
              />
            ) : (
              <p className="min-h-[60px] flex items-start px-3 py-2.5 rounded-md border bg-muted/50 text-sm">
                {form.description || 'No description provided'}
              </p>
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Contact Information
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="compEmail">Business Email</Label>
                {editingCompany ? (
                  <Input
                    id="compEmail"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="info@company.com"
                    className="h-12"
                  />
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                    {form.email || 'Not configured'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="compPhone">Business Phone</Label>
                {editingCompany ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">+233</span>
                    <Input
                      id="compPhone"
                      value={form.phone.replace('+233', '').replace(/^0/, '')}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="XX XXX XXXX"
                      className="flex-1 h-12"
                    />
                  </div>
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                    {form.phone ? formatPhoneGH(form.phone) : 'Not configured'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                {editingCompany ? (
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) => handleFieldChange('website', e.target.value)}
                    placeholder="https://www.company.com"
                    className="h-12"
                  />
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                    {form.website || 'Not configured'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Physical Address
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                {editingCompany ? (
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="e.g. 31 Makola Road"
                    className="h-12"
                  />
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                    {form.address || 'Not configured'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                {editingCompany ? (
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="e.g. Accra"
                    className="h-12"
                  />
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                    {form.city || 'Not configured'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                {editingCompany ? (
                  <div className="relative">
                    <select
                      id="region"
                      value={form.region}
                      onChange={(e) => handleFieldChange('region', e.target.value)}
                      className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {GHANA_REGIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                    {form.region}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="digitalAddress">Ghana Post Digital Address</Label>
                {editingCompany ? (
                  <Input
                    id="digitalAddress"
                    value={form.digitalAddress}
                    onChange={(e) => handleFieldChange('digitalAddress', e.target.value)}
                    placeholder="e.g. GA-123-4567"
                    className="h-12 font-mono"
                  />
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-mono">
                    {form.digitalAddress || 'Not configured'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Platform Settings */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Platform Settings
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Currency</Label>
                <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-semibold">
                  {form.currency === 'GHS' ? 'Ghana Cedi (GHS - ₵)' : 'US Dollar (USD - $)'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                {editingCompany ? (
                  <div className="relative">
                    <select
                      value={form.dateFormat}
                      onChange={(e) => handleFieldChange('dateFormat', e.target.value)}
                      className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (18/04/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (04/18/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-04-18)</option>
                    </select>
                  </div>
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                    {form.dateFormat}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                  {form.timezone} (GMT)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Default Language</Label>
                {editingCompany ? (
                  <div className="relative">
                    <select
                      value={form.defaultLanguage}
                      onChange={(e) => handleFieldChange('defaultLanguage', e.target.value)}
                      className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="en">English</option>
                      <option value="tw">Twi</option>
                      <option value="fa">Fante</option>
                      <option value="ga">Ga</option>
                    </select>
                  </div>
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                    {{ en: 'English', tw: 'Twi', fa: 'Fante', ga: 'Ga' }[form.defaultLanguage]}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Transaction Limits */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              Transaction Limits
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Max Daily Transaction Limit</Label>
                {editingCompany ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                    <Input
                      id="dailyLimit"
                      type="number"
                      value={form.maxDailyTransactionLimit}
                      onChange={(e) => handleFieldChange('maxDailyTransactionLimit', Number(e.target.value))}
                      className="h-12 pl-8 font-mono"
                    />
                  </div>
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-mono font-semibold">
                    {formatGHS(form.maxDailyTransactionLimit)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="singleLimit">Max Single Transaction Limit</Label>
                {editingCompany ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                    <Input
                      id="singleLimit"
                      type="number"
                      value={form.maxSingleTransactionLimit}
                      onChange={(e) => handleFieldChange('maxSingleTransactionLimit', Number(e.target.value))}
                      className="h-12 pl-8 font-mono"
                    />
                  </div>
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-mono font-semibold">
                    {formatGHS(form.maxSingleTransactionLimit)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minSusu">Min Susu Contribution</Label>
                {editingCompany ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                    <Input
                      id="minSusu"
                      type="number"
                      value={form.minSusuContribution}
                      onChange={(e) => handleFieldChange('minSusuContribution', Number(e.target.value))}
                      className="h-12 pl-8 font-mono"
                    />
                  </div>
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-mono font-semibold">
                    {formatGHS(form.minSusuContribution)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSusu">Max Susu Contribution</Label>
                {editingCompany ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                    <Input
                      id="maxSusu"
                      type="number"
                      value={form.maxSusuContribution}
                      onChange={(e) => handleFieldChange('maxSusuContribution', Number(e.target.value))}
                      className="h-12 pl-8 font-mono"
                    />
                  </div>
                ) : (
                  <p className="h-12 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-mono font-semibold">
                    {formatGHS(form.maxSusuContribution)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Registration Toggles */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Registration Settings
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Customer Self-Registration</Label>
                <p className="text-xs text-muted-foreground">Allow new customers to sign up on the platform</p>
              </div>
              <Switch
                checked={form.enableCustomerRegistration}
                onCheckedChange={(checked) => handleFieldChange('enableCustomerRegistration', checked)}
                disabled={!editingCompany}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Agent Self-Registration</Label>
                <p className="text-xs text-muted-foreground">Allow new agents to apply directly</p>
              </div>
              <Switch
                checked={form.enableAgentRegistration}
                onCheckedChange={(checked) => handleFieldChange('enableAgentRegistration', checked)}
                disabled={!editingCompany}
              />
            </div>
          </div>

          {/* Save button for mobile */}
          {editingCompany && (
            <div className="flex gap-3 pt-2 lg:hidden">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding &amp; Appearance
          </CardTitle>
          <CardDescription>Customize the platform look and feel for your company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary Brand Color</Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border-2" style={{ backgroundColor: form.primaryColor }} />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                  placeholder="#2563EB"
                  className="h-10 font-mono"
                  disabled={!editingCompany}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Brand Color</Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border-2" style={{ backgroundColor: form.secondaryColor }} />
                <Input
                  value={form.secondaryColor}
                  onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                  placeholder="#F59E0B"
                  className="h-10 font-mono"
                  disabled={!editingCompany}
                />
              </div>
            </div>
          </div>
          {!editingCompany && (
            <p className="text-xs text-muted-foreground">
              Click &quot;Edit Details&quot; above to modify branding colors.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================
// PAYMENT GATEWAYS TAB
// =============================================
function PaymentGatewaysTab() {
  const {
    paymentGateways, activePaymentGateway,
    setActivePaymentGateway, updatePaymentCredentials, testPaymentGateway,
  } = useConfigStore();
  const [expandedGateway, setExpandedGateway] = useState<string | null>(null);
  const [showCreds, setShowCreds] = useState<Record<string, boolean>>({});
  const [credForms, setCredForms] = useState<Record<string, Record<string, string>>>({});

  const toggleExpand = (id: string) => {
    setExpandedGateway(prev => prev === id ? null : id);
    // Initialize credential form when expanding
    const gw = paymentGateways.find(g => g.id === id);
    if (gw && !credForms[id]) {
      setCredForms(prev => ({
        ...prev,
        [id]: { ...gw.credentials },
      }));
    }
  };

  const handleCredChange = (gwId: string, field: string, value: string) => {
    setCredForms(prev => ({
      ...prev,
      [gwId]: { ...prev[gwId], [field]: value },
    }));
  };

  const saveCredentials = (gwId: string) => {
    if (credForms[gwId]) {
      updatePaymentCredentials(gwId as PaymentGatewayId, credForms[gwId]);
      toast.success('Credentials saved', {
        description: `${paymentGateways.find(g => g.id === gwId)?.name} credentials have been updated.`,
      });
    }
  };

  const handleActivate = (id: PaymentGatewayId) => {
    setActivePaymentGateway(activePaymentGateway === id ? null : id);
    toast.success(
      activePaymentGateway === id ? 'Payment gateway deactivated' : 'Payment gateway activated',
      {
        description: activePaymentGateway === id
          ? 'No payment gateway is currently active.'
          : `${paymentGateways.find(g => g.id === id)?.name} is now the active payment gateway.`,
      }
    );
  };

  const handleTest = (id: PaymentGatewayId) => {
    testPaymentGateway(id);
    toast.success('Connection test successful', {
      description: `Successfully connected to ${paymentGateways.find(g => g.id === id)?.name}.`,
    });
  };

  const gatewayIcons: Record<string, { bg: string; text: string; color: string }> = {
    hubtel: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'H', color: 'text-blue-600 dark:text-blue-400' },
    paystack: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'P', color: 'text-emerald-600 dark:text-emerald-400' },
  };

  return (
    <div className="space-y-6">
      {/* Active Gateway Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Active Payment Gateway</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activePaymentGateway
                  ? `${paymentGateways.find(g => g.id === activePaymentGateway)?.name} is processing all payments.`
                  : 'No payment gateway is currently active. Payments will not be processed.'}
              </p>
            </div>
            {activePaymentGateway && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {!activePaymentGateway && (
              <Badge variant="secondary" className="shrink-0">
                Not Set
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gateway Cards */}
      {paymentGateways.map((gw) => {
        const isActive = activePaymentGateway === gw.id;
        const isExpanded = expandedGateway === gw.id;
        const iconStyle = gatewayIcons[gw.id] || { bg: 'bg-muted', text: '?', color: 'text-muted-foreground' };
        const creds = credForms[gw.id] || gw.credentials;

        return (
          <Card key={gw.id} className={`transition-all ${isActive ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
            <CardContent className="p-0">
              {/* Gateway Header - Clickable */}
              <button
                onClick={() => toggleExpand(gw.id)}
                className="w-full flex items-center gap-3 p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
              >
                {/* Icon */}
                <div className={`flex items-center justify-center h-11 w-11 rounded-xl ${iconStyle.bg} shrink-0`}>
                  <span className={`text-lg font-bold ${iconStyle.color}`}>{iconStyle.text}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{gw.name}</h4>
                    {isActive && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-1.5">
                        Active
                      </Badge>
                    )}
                    {gw.lastTested && gw.testSuccessful && (
                      <Badge variant="outline" className="text-[10px] px-1.5 border-emerald-300 text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                        Tested
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{gw.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {gw.supportedMethods.map(method => (
                      <span key={method} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {method.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t px-4 sm:px-5 py-4 space-y-5">
                  {/* API Credentials */}
                  <div>
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      API Credentials
                    </h5>
                    <div className="space-y-3">
                      {[
                        { key: 'clientId', label: 'Client ID', placeholder: 'Enter Client ID' },
                        { key: 'apiKey', label: 'API Key', placeholder: 'Enter API Key', secret: true },
                        { key: 'clientSecret', label: 'Client Secret', placeholder: 'Enter Client Secret', secret: true },
                        { key: 'merchantAccountNumber', label: 'Merchant Account Number', placeholder: 'e.g. HM1234567890', optional: true },
                      ].map(field => (
                        <div key={field.key} className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1">
                            {field.label}
                            {field.optional && <span className="text-muted-foreground">(optional)</span>}
                          </Label>
                          <div className="relative">
                            <Input
                              type={field.secret && !showCreds[`${gw.id}-${field.key}`] ? 'password' : 'text'}
                              value={creds[field.key] || ''}
                              onChange={(e) => handleCredChange(gw.id, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="h-11 pr-10 font-mono text-sm"
                            />
                            {field.secret && (
                              <button
                                onClick={() => setShowCreds(prev => ({ ...prev, [`${gw.id}-${field.key}`]: !prev[`${gw.id}-${field.key}`] }))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                              >
                                {showCreds[`${gw.id}-${field.key}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Webhook Configuration */}
                  <div>
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Webhook Configuration
                    </h5>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Webhook URL</Label>
                        <Input
                          value={creds.webhookUrl || ''}
                          onChange={(e) => handleCredChange(gw.id, 'webhookUrl', e.target.value)}
                          placeholder="https://your-domain.com/api/webhooks/payment"
                          className="h-11 font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Payment status updates will be sent to this URL
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Callback URL</Label>
                        <Input
                          value={creds.callbackUrl || ''}
                          onChange={(e) => handleCredChange(gw.id, 'callbackUrl', e.target.value)}
                          placeholder="https://your-domain.com/api/callbacks/payment"
                          className="h-11 font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Users will be redirected here after payment
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Usage Toggles */}
                  <div>
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      Enable For
                    </h5>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { key: 'enabledForDeposits', label: 'Customer Deposits', icon: Wallet, desc: 'Wallet top-ups and funding' },
                        { key: 'enabledForWithdrawals', label: 'Withdrawals', icon: Landmark, desc: 'Payouts to MoMo and bank' },
                        { key: 'enabledForLoanDisbursement', label: 'Loan Disbursement', icon: CreditCard, desc: 'Direct loan payouts' },
                        { key: 'enabledForSusuPayouts', label: 'Susu Payouts', icon: Gift, desc: 'Group rotation payments' },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <Label className="text-xs font-medium">{item.label}</Label>
                                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                              </div>
                            </div>
                            <Switch
                              checked={gw[item.key as keyof typeof gw] as boolean}
                              disabled={!isActive}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {!isActive && (
                      <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Activate this gateway first to enable specific features.
                      </p>
                    )}
                  </div>

                  {/* Fee Info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>
                      Transaction fee: <strong>{gw.transactionFeePercent}%</strong>
                      {gw.flatFee > 0 && <> + <strong>{formatGHS(gw.flatFee)}</strong> flat fee per transaction</>}.
                      {gw.website && (
                        <>
                          {' '}Learn more at{' '}
                          <a href={gw.website} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-0.5">
                            {gw.website} <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => saveCredentials(gw.id)}
                    >
                      <Key className="h-3.5 w-3.5" />
                      Save Credentials
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleTest(gw.id as PaymentGatewayId)}
                    >
                      <Radio className="h-3.5 w-3.5" />
                      Test Connection
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      className="gap-1.5"
                      variant={isActive ? 'destructive' : 'default'}
                      onClick={() => handleActivate(gw.id as PaymentGatewayId)}
                    >
                      {isActive ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Set as Active
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// =============================================
// SMS & OTP PROVIDERS TAB
// =============================================
function SMSProvidersTab() {
  const {
    smsProviders, activeSMSProvider,
    setActiveSMSProvider, updateSMSCredentials, updateSMSProvider, testSMSProvider,
  } = useConfigStore();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [showCreds, setShowCreds] = useState<Record<string, boolean>>({});
  const [credForms, setCredForms] = useState<Record<string, Record<string, string>>>({});

  const toggleExpand = (id: string) => {
    setExpandedProvider(prev => prev === id ? null : id);
    const prov = smsProviders.find(p => p.id === id);
    if (prov && !credForms[id]) {
      setCredForms(prev => ({
        ...prev,
        [id]: { ...prov.credentials },
      }));
    }
  };

  const handleCredChange = (provId: string, field: string, value: string) => {
    setCredForms(prev => ({
      ...prev,
      [provId]: { ...prev[provId], [field]: value },
    }));
  };

  const saveCredentials = (provId: string) => {
    if (credForms[provId]) {
      updateSMSCredentials(provId as SMSProviderId, credForms[provId]);
      toast.success('Credentials saved', {
        description: `${smsProviders.find(p => p.id === provId)?.name} credentials have been updated.`,
      });
    }
  };

  const handleActivate = (id: SMSProviderId) => {
    setActiveSMSProvider(activeSMSProvider === id ? null : id);
    toast.success(
      activeSMSProvider === id ? 'SMS provider deactivated' : 'SMS provider activated',
      {
        description: activeSMSProvider === id
          ? 'No SMS provider is currently active.'
          : `${smsProviders.find(p => p.id === id)?.name} is now the active SMS/OTP provider.`,
      }
    );
  };

  const handleTest = (id: SMSProviderId) => {
    testSMSProvider(id);
    toast.success('Test SMS sent', {
      description: `A test OTP was sent via ${smsProviders.find(p => p.id === id)?.name}.`,
    });
  };

  const providerIcons: Record<string, { bg: string; text: string; color: string }> = {
    hubtel: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'H', color: 'text-blue-600 dark:text-blue-400' },
    arkesel: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'A', color: 'text-violet-600 dark:text-violet-400' },
  };

  return (
    <div className="space-y-6">
      {/* Active Provider Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Active SMS &amp; OTP Provider</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeSMSProvider
                  ? `${smsProviders.find(p => p.id === activeSMSProvider)?.name} is handling all SMS and OTP delivery.`
                  : 'No SMS provider is currently active. OTPs and notifications will not be sent.'}
              </p>
            </div>
            {activeSMSProvider && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {!activeSMSProvider && (
              <Badge variant="secondary" className="shrink-0">Not Set</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      {smsProviders.map((prov) => {
        const isActive = activeSMSProvider === prov.id;
        const isExpanded = expandedProvider === prov.id;
        const iconStyle = providerIcons[prov.id] || { bg: 'bg-muted', text: '?', color: 'text-muted-foreground' };
        const creds = credForms[prov.id] || prov.credentials;

        return (
          <Card key={prov.id} className={`transition-all ${isActive ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
            <CardContent className="p-0">
              {/* Provider Header */}
              <button
                onClick={() => toggleExpand(prov.id)}
                className="w-full flex items-center gap-3 p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
              >
                <div className={`flex items-center justify-center h-11 w-11 rounded-xl ${iconStyle.bg} shrink-0`}>
                  <span className={`text-lg font-bold ${iconStyle.color}`}>{iconStyle.text}</span>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{prov.name}</h4>
                    {isActive && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-1.5">
                        Active
                      </Badge>
                    )}
                    {prov.lastTested && prov.testSuccessful && (
                      <Badge variant="outline" className="text-[10px] px-1.5 border-emerald-300 text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                        Tested
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{prov.description}</p>
                </div>

                <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t px-4 sm:px-5 py-4 space-y-5">
                  {/* API Credentials */}
                  <div>
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      API Credentials
                    </h5>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">API Key</Label>
                        <div className="relative">
                          <Input
                            type={showCreds[`${prov.id}-apiKey`] ? 'text' : 'password'}
                            value={creds.apiKey || ''}
                            onChange={(e) => handleCredChange(prov.id, 'apiKey', e.target.value)}
                            placeholder="Enter your API key"
                            className="h-11 pr-10 font-mono text-sm"
                          />
                          <button
                            onClick={() => setShowCreds(prev => ({ ...prev, [`${prov.id}-apiKey`]: !prev[`${prov.id}-apiKey`] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                          >
                            {showCreds[`${prov.id}-apiKey`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sender ID</Label>
                        <Input
                          value={creds.senderId || ''}
                          onChange={(e) => handleCredChange(prov.id, 'senderId', e.target.value)}
                          placeholder="e.g. iSusuPro"
                          className="h-11 font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          This name appears as the SMS sender. Must be registered with the provider (max 11 chars).
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* SMS Features */}
                  <div>
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      Enable For
                    </h5>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { key: 'enabledForOTP', label: 'OTP Verification', icon: ShieldCheck, desc: 'Login and transaction verification codes' },
                        { key: 'enabledForNotifications', label: 'Notifications', icon: Bell, desc: 'Payment confirmations, susu reminders' },
                        { key: 'enabledForAlerts', label: 'System Alerts', icon: AlertOctagon, desc: 'Security and fraud alerts' },
                        { key: 'enabledForMarketing', label: 'Marketing SMS', icon: Megaphone, desc: 'Promotions and product announcements' },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <Label className="text-xs font-medium">{item.label}</Label>
                                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                              </div>
                            </div>
                            <Switch checked={prov[item.key as keyof typeof prov] as boolean} disabled={!isActive} />
                          </div>
                        );
                      })}
                    </div>
                    {!isActive && (
                      <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Activate this provider first to enable specific features.
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* OTP Settings */}
                  <div>
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      OTP Settings
                    </h5>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">OTP Expiry (seconds)</Label>
                        <Input
                          type="number"
                          value={prov.otpExpirySeconds}
                          onChange={(e) => updateSMSProvider(prov.id as SMSProviderId, { otpExpirySeconds: Number(e.target.value) })}
                          className="h-11 font-mono text-sm"
                          disabled={!isActive}
                        />
                        <p className="text-[10px] text-muted-foreground">Default: 300s (5 min)</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Max OTP Retries</Label>
                        <Input
                          type="number"
                          value={prov.maxOTPRetry}
                          onChange={(e) => updateSMSProvider(prov.id as SMSProviderId, { maxOTPRetry: Number(e.target.value) })}
                          className="h-11 font-mono text-sm"
                          disabled={!isActive}
                        />
                        <p className="text-[10px] text-muted-foreground">Default: 3 attempts</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Daily SMS Limit</Label>
                        <Input
                          type="number"
                          value={prov.smsPerDayLimit}
                          onChange={(e) => updateSMSProvider(prov.id as SMSProviderId, { smsPerDayLimit: Number(e.target.value) })}
                          className="h-11 font-mono text-sm"
                          disabled={!isActive}
                        />
                        <p className="text-[10px] text-muted-foreground">Per day across all users</p>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>
                      Learn more at{' '}
                      <a href={prov.website} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-0.5">
                        {prov.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => saveCredentials(prov.id)}>
                      <Key className="h-3.5 w-3.5" />
                      Save Credentials
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleTest(prov.id as SMSProviderId)}>
                      <Send className="h-3.5 w-3.5" />
                      Send Test OTP
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      className="gap-1.5"
                      variant={isActive ? 'destructive' : 'default'}
                      onClick={() => handleActivate(prov.id as SMSProviderId)}
                    >
                      {isActive ? (
                        <><XCircle className="h-3.5 w-3.5" />Deactivate</>
                      ) : (
                        <><CheckCircle2 className="h-3.5 w-3.5" />Set as Active</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// =============================================
// PROFILE TAB
// =============================================
function ProfileTab({ user }: { user: { name: string; email: string; phone: string; memberSince: string } }) {
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [branch, setBranch] = useState('Head Office');

  // System preferences
  const [notifications, setNotifications] = useState({
    securityAlerts: true,
    loanAlerts: true,
    agentAlerts: true,
    systemAlerts: true,
    email: true,
    sms: true,
    push: true,
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Profile Card */}
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
                onClick={() => toast.info('Upload feature', { description: 'Profile photo upload is not available in demo mode.' })}
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div>
              <p className="font-medium text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{formatPhoneGH(user.phone)}</p>
              <p className="text-xs text-muted-foreground mt-1">Admin since {formatDate(user.memberSince)}</p>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">+233</span>
                <Input id="phone" value={phone.replace('+233', '').replace(/^0/, '')} onChange={(e) => setPhone(e.target.value)} placeholder="24 XXX XXXX" className="flex-1 h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="flex items-center gap-2">
                <Input id="role" value="System Administrator" disabled className="h-12 bg-muted" />
                <Badge variant="secondary" className="shrink-0">Read-only</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Assigned branch" className="h-12" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile}>Save Changes</Button>
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
          <CardDescription>Choose which system alerts you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'securityAlerts' as const, label: 'Security Alerts', description: 'Suspicious login attempts and security events' },
            { key: 'loanAlerts' as const, label: 'Loan Alerts', description: 'New loan applications and overdue payments' },
            { key: 'agentAlerts' as const, label: 'Agent Performance Alerts', description: 'Agent compliance and performance reports' },
            { key: 'systemAlerts' as const, label: 'System Alerts', description: 'Platform errors, downtime, and updates' },
            { key: 'email' as const, label: 'Email Notifications', description: 'Receive critical alerts via email' },
            { key: 'sms' as const, label: 'SMS Notifications', description: 'Receive urgent alerts via text message' },
            { key: 'push' as const, label: 'Push Notifications', description: 'Receive push notifications on your device' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{item.label}</Label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch checked={notifications[item.key]} onCheckedChange={() => handleNotificationToggle(item.key)} />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveSystemSettings}>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>Configure default platform settings and behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Enable to temporarily disable customer access for system updates. All active sessions will be terminated.
                </p>
              </div>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={(checked) => {
                setMaintenanceMode(checked);
                toast.success(
                  checked ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
                  { description: checked ? 'Customer portal is now inaccessible.' : 'Customer portal is now accessible.' }
                );
              }}
              className="scale-110 shrink-0"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================
// SECURITY TAB
// =============================================
function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  const [apiKey] = useState('isp_admin_sk_7f3a9b2c4d5e6f1a8b9c0d1e2f3a4b5c');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const [sessions] = useState([
    { id: '1', device: 'Chrome on Windows (Desktop)', location: 'Accra, Ghana', lastActive: 'Active now', current: true },
    { id: '2', device: 'Safari on MacBook Pro', location: 'Accra, Ghana', lastActive: '1 hour ago', current: false },
    { id: '3', device: 'Firefox on Linux', location: 'Kumasi, Ghana', lastActive: '5 hours ago', current: false },
  ]);
  const [revokedSessions, setRevokedSessions] = useState<Set<string>>(new Set());

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Missing fields', { description: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', { description: 'New password and confirmation must be the same.' });
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Weak password', { description: 'Password must be at least 8 characters long.' });
      return;
    }
    toast.success('Password changed', { description: 'Your admin password has been updated successfully.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRevokeSession = (id: string, device: string) => {
    setRevokedSessions((prev) => new Set(prev).add(id));
    toast.success('Session revoked', { description: `${device} has been logged out.` });
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey).then(
      () => toast.success('API key copied', { description: 'API key has been copied to clipboard.' }),
      () => toast.info('API key copied', { description: apiKey })
    );
  };

  const handleRegenerateApiKey = () => {
    toast.success('API key regenerated', { description: 'A new API key has been generated. The old key is now invalid.' });
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Change Password</CardTitle>
          <CardDescription>Update your admin password regularly to maintain security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: 'currentPassword', label: 'Current Password', value: currentPassword, setter: setCurrentPassword, show: showCurrentPassword, setShow: setShowCurrentPassword },
            { id: 'newPassword', label: 'New Password', value: newPassword, setter: setNewPassword, show: showNewPassword, setShow: setShowNewPassword },
            { id: 'confirmPassword', label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, setShow: setShowConfirmPassword },
          ].map(field => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <div className="relative">
                <Input
                  id={field.id}
                  type={field.show ? 'text' : 'password'}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.id === 'currentPassword' ? 'Enter current password' : field.id === 'newPassword' ? 'Enter new password (min 8 characters)' : 'Confirm new password'}
                  className="h-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => field.setShow(!field.show)}
                >
                  {field.show ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button onClick={handleChangePassword}>Update Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5" />Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your admin account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Two-Factor Authentication (2FA)</Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">Require a verification code via authenticator app when signing in</p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={(checked) => {
                setTwoFactorEnabled(checked);
                toast.success(checked ? '2FA enabled' : '2FA disabled', {
                  description: checked ? 'You will need an authenticator code when signing in.' : 'Two-factor authentication has been turned off.',
                });
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
              <p className="text-xs text-muted-foreground pl-6">Use fingerprint or face recognition to sign in quickly</p>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={(checked) => {
                setBiometricEnabled(checked);
                toast.success(checked ? 'Biometric login enabled' : 'Biometric login disabled', {
                  description: checked ? 'You can now use biometrics to sign in.' : 'Biometric sign-in has been turned off.',
                });
              }}
              className="scale-110"
            />
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />API Key</CardTitle>
          <CardDescription>Your admin API key for system integrations and external services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={apiKeyVisible ? apiKey : '•••••••••••••••••••••••••••••••••••••••'}
              className="h-12 font-mono text-sm"
            />
            <Button variant="outline" size="icon" className="shrink-0 h-12 w-12" onClick={() => setApiKeyVisible(!apiKeyVisible)}>
              {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" className="shrink-0 h-12 w-12" onClick={handleCopyApiKey}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Keep your API key secret. Never share it in publicly accessible areas.</p>
            <Button variant="destructive" size="sm" className="gap-1.5 shrink-0" onClick={handleRegenerateApiKey}>
              <RefreshCw className="h-3.5 w-3.5" />Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Active Sessions</CardTitle>
          <CardDescription>Devices currently logged into your admin account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.filter((s) => !revokedSessions.has(s.id)).map((session) => (
            <div key={session.id} className="mobile-list-item flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Smartphone className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{session.device}</p>
                    {session.current && <Badge variant="secondary" className="text-[10px] shrink-0">Current</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{session.location} &bull; {session.lastActive}</p>
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
    </div>
  );
}
