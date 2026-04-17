'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { useCustomerStore, useAgentStore, useAdminStore, useTreasurerStore, useNavigationStore } from '@/store/app-store';
import { getInitials } from '@/lib/formatters';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  { id: 'susu', label: 'Susu Savings', icon: PiggyBank },
  { id: 'loans', label: 'Loans', icon: Landmark },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
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
  { id: 'susu-groups', label: 'Susu Groups', icon: UsersRound },
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

// ---- Helper: get nav items for a portal ----
function getNavItems(portal: string): NavItem[] {
  switch (portal) {
    case 'customer': return customerNavItems;
    case 'agent': return agentNavItems;
    case 'admin': return adminNavItems;
    case 'treasurer': return treasurerNavItems;
    default: return [];
  }
}

// ---- Sidebar Nav Content (shared between desktop & mobile) ----
interface SidebarContentProps {
  portal: string;
  activePage: string;
  user: { name: string; email?: string };
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

function SidebarNavContent({ portal, activePage, user, onNavigate, onLogout }: SidebarContentProps) {
  const navItems = getNavItems(portal);
  const initials = getInitials(user.name);
  const userRole = portalRoles[portal] || '';

  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="flex items-center gap-3 px-6 h-16 border-b">
        <Landmark className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-bold text-lg leading-tight">SusuPay</h1>
          <p className="text-xs text-muted-foreground">{portalLabels[portal]}</p>
        </div>
      </div>

      {/* Navigation items */}
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`
                      relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                      transition-colors duration-150 cursor-pointer
                      ${isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                    )}
                    <Icon className="h-5 w-5 shrink-0" />
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

      {/* User section at bottom */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{userRole}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Logout
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// ---- Main AppLayout Component ----
export function AppLayout() {
  const { currentPortal, sidebarOpen, toggleSidebar, setSidebarOpen, logout } = useNavigationStore();
  const { theme, setTheme } = useTheme();

  // Get store data based on current portal (all hooks must be called unconditionally)
  const customerStore = useCustomerStore();
  const agentStore = useAgentStore();
  const adminStore = useAdminStore();
  const treasurerStore = useTreasurerStore();

  // If no portal is active, render the login page
  if (!currentPortal) {
    return <LoginPage />;
  }

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

  // Notification count
  const notificationCount = (() => {
    switch (currentPortal) {
      case 'customer':
        return customerStore.notifications.filter(n => !n.read).length;
      default:
        return 0;
    }
  })();

  // Page navigation handler
  const handleNavigate = (page: string) => {
    switch (currentPortal) {
      case 'customer':
        customerStore.setActivePage(page);
        break;
      case 'agent':
        agentStore.setActivePage(page);
        break;
      case 'admin':
        adminStore.setActivePage(page);
        break;
      case 'treasurer':
        treasurerStore.setActivePage(page);
        break;
    }
    setSidebarOpen(false);
  };

  // Render current page based on portal and activePage
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
      default:
        return <LoginPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-sidebar">
        <SidebarNavContent
          portal={currentPortal}
          activePage={activePage}
          user={{ name: user.name, email: user.email }}
          onNavigate={handleNavigate}
          onLogout={logout}
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b flex items-center px-4 lg:px-6 gap-4 bg-background shrink-0">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          {/* Page title */}
          <h2 className="font-semibold text-lg">{pageTitle}</h2>

          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold border-2 border-background">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {notificationCount > 0 ? `${notificationCount} unread notifications` : 'No new notifications'}
              </TooltipContent>
            </Tooltip>

            {/* Dark mode toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium leading-tight">{user.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{portalRoles[currentPortal]}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/30">
          {renderCurrentPage()}
        </div>
      </main>

      {/* Mobile sidebar overlay using Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarNavContent
            portal={currentPortal}
            activePage={activePage}
            user={{ name: user.name, email: user.email }}
            onNavigate={handleNavigate}
            onLogout={logout}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
