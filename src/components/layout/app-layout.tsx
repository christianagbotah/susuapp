'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerStore, useAgentStore, useAdminStore, useTreasurerStore, useNavigationStore } from '@/store/app-store';
import { getInitials } from '@/lib/formatters';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BottomTabBar, MobileDrawer, MobilePageHeader,
  type BottomTabItem,
} from '@/components/shared/mobile-components';

import {
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Wallet,
  ArrowLeftRight,
  Settings,
  Menu,
  LogOut,
  Bell,
  Moon,
  Sun,
  Route,
  Users,
  BadgeDollarSign,
  Building2,
  UsersRound,
  BarChart3,
  ShieldAlert,
  Gift,
  FileText,
  ChevronDown,
  X,
  Home,
  MoreHorizontal,
} from 'lucide-react';

// Page component imports
import { LoginPage } from '@/components/pages/auth/login-page';
import { CustomerDashboard } from '@/components/pages/customer/customer-dashboard';
import { CustomerSusu } from '@/components/pages/customer/customer-susu';
import { CustomerLoans } from '@/components/pages/customer/customer-loans';
import { CustomerWallet } from '@/components/pages/customer/customer-wallet';
import { CustomerTransactions } from '@/components/pages/customer/customer-transactions';
import { CustomerSettings } from '@/components/pages/customer/customer-settings';
import { AgentDashboard } from '@/components/pages/agent/agent-dashboard';
import { AgentCollections } from '@/components/pages/agent/agent-collections';
import { AgentCustomers } from '@/components/pages/agent/agent-customers';
import { AgentCommissions } from '@/components/pages/agent/agent-commissions';
import { AdminDashboard } from '@/components/pages/admin/admin-dashboard';
import { AdminUsers } from '@/components/pages/admin/admin-users';
import { AdminLoans } from '@/components/pages/admin/admin-loans';
import { AdminAgents } from '@/components/pages/admin/admin-agents';
import { AdminSusuGroups } from '@/components/pages/admin/admin-susu-groups';
import { AdminAnalytics } from '@/components/pages/admin/admin-analytics';
import { AdminCompliance } from '@/components/pages/admin/admin-compliance';
import { TreasurerDashboard } from '@/components/pages/treasurer/treasurer-dashboard';
import { TreasurerGroups } from '@/components/pages/treasurer/treasurer-groups';
import { TreasurerPayouts } from '@/components/pages/treasurer/treasurer-payouts';
import { TreasurerMembers } from '@/components/pages/treasurer/treasurer-members';
import { TreasurerReports } from '@/components/pages/treasurer/treasurer-reports';

import type { LucideIcon } from 'lucide-react';

// ---- Types ----
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

// ---- Navigation Configs ----
const customerNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'susu', label: 'Susu', icon: PiggyBank },
  { id: 'loans', label: 'Loans', icon: Landmark },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'transactions', label: 'History', icon: ArrowLeftRight },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const agentNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'collections', label: 'Collections', icon: Route },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'commissions', label: 'Commissions', icon: BadgeDollarSign },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const adminNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'loans', label: 'Loans', icon: Landmark },
  { id: 'agents', label: 'Agents', icon: Building2 },
  { id: 'susu-groups', label: 'Susu', icon: UsersRound },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'compliance', label: 'Compliance', icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const treasurerNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'groups', label: 'Groups', icon: UsersRound },
  { id: 'payouts', label: 'Payouts', icon: Gift },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const portalLabels: Record<string, string> = {
  customer: 'Customer Portal',
  agent: 'Agent Portal',
  admin: 'Admin Portal',
  treasurer: 'Treasurer Portal',
};

const portalRoles: Record<string, string> = {
  customer: 'Customer',
  agent: 'Field Agent',
  admin: 'System Admin',
  treasurer: 'Group Treasurer',
};

// Bottom tabs: first N items shown in bottom bar, rest in "More" drawer
function getBottomTabs(navItems: NavItem[], portal: string): BottomTabItem[] {
  const maxTabs = portal === 'admin' ? 4 : 5; // Admin has more nav items
  return navItems.slice(0, maxTabs).map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
  }));
}

function getDrawerOnlyItems(navItems: NavItem[], portal: string): NavItem[] {
  const maxTabs = portal === 'admin' ? 4 : 5;
  return navItems.slice(maxTabs);
}

// ---- Helpers ----
function getNavItems(portal: string): NavItem[] {
  switch (portal) {
    case 'customer': return customerNavItems;
    case 'agent': return agentNavItems;
    case 'admin': return adminNavItems;
    case 'treasurer': return treasurerNavItems;
    default: return [];
  }
}

// ---- Desktop Sidebar Content ----
function DesktopSidebar({ portal, activePage, user, onNavigate, onLogout }: {
  portal: string; activePage: string; user: { name: string; email?: string };
  onNavigate: (page: string) => void; onLogout: () => void;
}) {
  const navItems = getNavItems(portal);
  const initials = getInitials(user.name);
  const userRole = portalRoles[portal] || '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 h-16 border-b safe-area-top">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
          <Landmark className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg leading-tight tracking-tight">SusuPay</h1>
          <p className="text-[11px] text-muted-foreground">{portalLabels[portal]}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`touch-target relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                    )}
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'stroke-[2.2px]' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{userRole}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Mobile Drawer Content ----
function MobileDrawerContent({ portal, activePage, user, onNavigate, onLogout, onClose }: {
  portal: string; activePage: string; user: { name: string; email?: string; phone?: string };
  onNavigate: (page: string) => void; onLogout: () => void; onClose: () => void;
}) {
  const navItems = getNavItems(portal);
  const initials = getInitials(user.name);
  const userRole = portalRoles[portal] || '';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with safe area */}
      <div className="safe-area-top flex items-center justify-between px-4 h-14 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
            <Landmark className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">SusuPay</h1>
            <p className="text-[10px] text-muted-foreground">{portalLabels[portal]}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="touch-target flex items-center justify-center h-10 w-10 -mr-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Profile Card */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-base font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{userRole}</p>
            {user.phone && (
              <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <ScrollArea className="flex-1">
        <nav className="px-3 space-y-0.5 pb-4">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={`touch-target w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className={`flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${
                  isActive ? 'bg-primary/15' : 'bg-muted'
                }`}>
                  <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="border-t px-4 py-3 safe-area-bottom">
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="touch-target w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-destructive/10">
            <LogOut className="h-[18px] w-[18px]" />
          </div>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// ---- Page Transition Wrapper ----
function PageTransition({ children, pageKey }: { children: React.ReactNode; pageKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ---- Main AppLayout ----
export function AppLayout() {
  const { currentPortal, sidebarOpen, toggleSidebar, setSidebarOpen, logout } = useNavigationStore();
  const { theme, setTheme } = useTheme();

  // Get store data (all hooks must be called unconditionally)
  const customerStore = useCustomerStore();
  const agentStore = useAgentStore();
  const adminStore = useAdminStore();
  const treasurerStore = useTreasurerStore();

  // Login state
  if (!currentPortal) {
    return <LoginPage />;
  }

  // Store resolution
  const storeMap = {
    customer: customerStore,
    agent: agentStore,
    admin: adminStore,
    treasurer: treasurerStore,
  };
  const store = storeMap[currentPortal];
  const activePage = store.activePage;
  const user = store.user;
  const initials = getInitials(user.name);
  const navItems = getNavItems(currentPortal);
  const pageTitle = navItems.find(n => n.id === activePage)?.label || 'Dashboard';

  // Bottom tabs (subset of nav for mobile tab bar)
  const bottomTabs = getBottomTabs(navItems, currentPortal);

  // Notification count
  const notificationCount = (() => {
    switch (currentPortal) {
      case 'customer':
        return customerStore.notifications.filter(n => !n.read).length;
      default: return 0;
    }
  })();

  // Navigation handler
  const handleNavigate = (page: string) => {
    switch (currentPortal) {
      case 'customer': customerStore.setActivePage(page); break;
      case 'agent': agentStore.setActivePage(page); break;
      case 'admin': adminStore.setActivePage(page); break;
      case 'treasurer': treasurerStore.setActivePage(page); break;
    }
    setSidebarOpen(false);
  };

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPortal) {
      case 'customer':
        switch (activePage) {
          case 'dashboard': return <CustomerDashboard />;
          case 'susu': return <CustomerSusu />;
          case 'loans': return <CustomerLoans />;
          case 'wallet': return <CustomerWallet />;
          case 'transactions': return <CustomerTransactions />;
          case 'settings': return <CustomerSettings />;
          default: return <CustomerDashboard />;
        }
      case 'agent':
        switch (activePage) {
          case 'dashboard': return <AgentDashboard />;
          case 'collections': return <AgentCollections />;
          case 'customers': return <AgentCustomers />;
          case 'commissions': return <AgentCommissions />;
          case 'settings': return <CustomerSettings />;
          default: return <AgentDashboard />;
        }
      case 'admin':
        switch (activePage) {
          case 'dashboard': return <AdminDashboard />;
          case 'users': return <AdminUsers />;
          case 'loans': return <AdminLoans />;
          case 'agents': return <AdminAgents />;
          case 'susu-groups': return <AdminSusuGroups />;
          case 'analytics': return <AdminAnalytics />;
          case 'compliance': return <AdminCompliance />;
          case 'settings': return <CustomerSettings />;
          default: return <AdminDashboard />;
        }
      case 'treasurer':
        switch (activePage) {
          case 'dashboard': return <TreasurerDashboard />;
          case 'groups': return <TreasurerGroups />;
          case 'payouts': return <TreasurerPayouts />;
          case 'members': return <TreasurerMembers />;
          case 'reports': return <TreasurerReports />;
          case 'settings': return <CustomerSettings />;
          default: return <TreasurerDashboard />;
        }
      default: return <LoginPage />;
    }
  };

  // Has bottom nav on mobile
  const hasBottomNav = bottomTabs.length > 0;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* ============ Desktop Sidebar (lg+) ============ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 border-r bg-sidebar shrink-0">
        <DesktopSidebar
          portal={currentPortal}
          activePage={activePage}
          user={{ name: user.name, email: user.email }}
          onNavigate={handleNavigate}
          onLogout={logout}
        />
      </aside>

      {/* ============ Main Content Area ============ */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ---- Desktop Top Bar (lg+) ---- */}
        <header className="hidden lg:flex h-16 border-b items-center px-6 gap-4 bg-background shrink-0 safe-area-top">
          <h2 className="font-semibold text-lg">{pageTitle}</h2>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative touch-target">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold border-2 border-background">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{notificationCount > 0 ? `${notificationCount} unread` : 'No notifications'}</TooltipContent>
            </Tooltip>

            {/* Dark mode */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="touch-target">
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
            </Tooltip>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium leading-tight">{user.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{portalRoles[currentPortal]}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate('settings')}>
                  <Settings className="mr-2 h-4 w-4" />Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ---- Mobile Header (below lg) ---- */}
        <div className="lg:hidden safe-area-top sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50 shrink-0">
          <div className="flex items-center h-12 px-3 gap-2">
            {/* Drawer toggle */}
            <button
              onClick={toggleSidebar}
              className="touch-target flex items-center justify-center -ml-1 h-10 w-10 rounded-full hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 shrink-0">
                <Landmark className="h-4 w-4 text-primary" />
              </div>
              <h1 className="font-bold text-sm truncate">SusuPay</h1>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Notifications */}
              <button className="touch-target relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition-colors">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="touch-target flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition-colors"
              >
                <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>

              {/* User avatar */}
              <button
                onClick={toggleSidebar}
                className="touch-target flex items-center justify-center -mr-1"
              >
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </div>

        {/* ---- Page Content ---- */}
        <div className={`flex-1 overflow-y-auto no-pull-refresh ${
          hasBottomNav ? 'pb-20 lg:pb-0' : ''
        }`}>
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {/* Desktop page title (shown in top bar on mobile) */}
            <h2 className="hidden lg:block font-semibold text-xl mb-5">{pageTitle}</h2>
            <PageTransition pageKey={activePage}>
              {renderCurrentPage()}
            </PageTransition>
          </div>
        </div>
      </main>

      {/* ============ Mobile Bottom Tab Bar (below lg) ============ */}
      {hasBottomNav && (
        <BottomTabBar
          items={bottomTabs}
          activeId={activePage}
          onTabChange={handleNavigate}
        />
      )}

      {/* ============ Mobile Drawer ============ */}
      <MobileDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      >
        <MobileDrawerContent
          portal={currentPortal}
          activePage={activePage}
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          onClose={() => setSidebarOpen(false)}
        />
      </MobileDrawer>
    </div>
  );
}
