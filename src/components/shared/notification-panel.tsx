'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useCustomerStore } from '@/store/app-store';
import { MobileDrawer } from '@/components/shared/mobile-components';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatTimeAgo } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  X,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
  CheckCheck,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import type { Notification } from '@/lib/types';

// ---- Notification type configuration ----

interface NotificationTypeConfig {
  icon: typeof Info;
  color: string;
  bg: string;
  label: string;
}

function getNotificationTypeConfig(type: Notification['type']): NotificationTypeConfig {
  switch (type) {
    case 'info':
      return {
        icon: Info,
        color: 'text-blue-500 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        label: 'Info',
      };
    case 'success':
      return {
        icon: CheckCircle,
        color: 'text-emerald-500 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        label: 'Success',
      };
    case 'warning':
      return {
        icon: AlertCircle,
        color: 'text-amber-500 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        label: 'Warning',
      };
    case 'error':
      return {
        icon: XCircle,
        color: 'text-red-500 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        label: 'Error',
      };
  }
}

// ---- Portal-specific mock notification data ----

export const agentNotifications: Notification[] = [
  {
    id: 'agent-n1',
    title: 'Collection Reminder — Nima Route',
    message: 'You have 12 pending daily susu collections on the Nima Market route. Total expected: ₵480.00. Please complete before 4:00 PM.',
    type: 'warning',
    date: new Date(Date.now() - 25 * 60000).toISOString(),
    read: false,
    category: 'collections',
  },
  {
    id: 'agent-n2',
    title: 'Commission Payout Credited',
    message: 'Your commission of ₵185.50 for susu collections (15–30 June) has been credited to your MTN MoMo wallet. Reference: ISP-COM-7281.',
    type: 'success',
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
    category: 'commissions',
  },
  {
    id: 'agent-n3',
    title: 'New Customer Assigned',
    message: 'Ama Serwaa (ID: USR-1082) has been assigned to your territory — Madina. She joins the "Adom Savings" susu group starting next Monday.',
    type: 'info',
    date: new Date(Date.now() - 5 * 3600000).toISOString(),
    read: false,
    category: 'customers',
  },
  {
    id: 'agent-n4',
    title: 'Route Update — East Legon',
    message: 'The East Legon collection route has been updated. Two new pickup points added at Trassaco Estate. Review your updated schedule.',
    type: 'info',
    date: new Date(Date.now() - 8 * 3600000).toISOString(),
    read: true,
    category: 'collections',
  },
  {
    id: 'agent-n5',
    title: 'Performance Milestone Reached! 🎉',
    message: 'Congratulations! You have onboarded 50 customers this quarter — qualifying you for the Gold Agent bonus of ₵500.00. Contact your branch manager.',
    type: 'success',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    read: false,
    category: 'performance',
  },
  {
    id: 'agent-n6',
    title: 'Overdue Collection — Kwame Asante',
    message: 'Kwame Asante (USR-0945) has missed 3 consecutive daily contributions totaling ₵45.00. Please follow up at your earliest convenience.',
    type: 'error',
    date: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    read: true,
    category: 'collections',
  },
  {
    id: 'agent-n7',
    title: 'Loan Referral Bonus',
    message: 'Your referral for a ₵2,000.00 business loan (Applicant: Felicia Mensah) has been approved. A ₵100.00 referral commission will be paid with next cycle.',
    type: 'success',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    read: true,
    category: 'commissions',
  },
];

export const adminNotifications: Notification[] = [
  {
    id: 'admin-n1',
    title: 'Loan Approval Pending — ₵5,000.00',
    message: 'Kofi Boateng (USR-0312) has applied for a ₵5,000.00 business loan. Credit score: 72. Awaiting your review and approval.',
    type: 'warning',
    date: new Date(Date.now() - 15 * 60000).toISOString(),
    read: false,
    category: 'loans',
  },
  {
    id: 'admin-n2',
    title: 'KYC Compliance Alert',
    message: '23 users have expired KYC documents requiring renewal. 8 accounts have been flagged as "basic" level for over 90 days. Review required.',
    type: 'error',
    date: new Date(Date.now() - 45 * 60000).toISOString(),
    read: false,
    category: 'compliance',
  },
  {
    id: 'admin-n3',
    title: 'System Update Scheduled',
    message: 'Platform maintenance is scheduled for Saturday 2:00–4:00 AM GMT. All services will be briefly unavailable. Notify your teams accordingly.',
    type: 'info',
    date: new Date(Date.now() - 3 * 3600000).toISOString(),
    read: false,
    category: 'system',
  },
  {
    id: 'admin-n4',
    title: 'New Agent Registration — Tema Branch',
    message: 'Emmanuel Darko has completed onboarding and is now active in the Tema branch territory. Agent code: AGT-0418. Performance monitoring is active.',
    type: 'info',
    date: new Date(Date.now() - 6 * 3600000).toISOString(),
    read: true,
    category: 'agents',
  },
  {
    id: 'admin-n5',
    title: 'Monthly Loan Default Rate Up',
    message: 'The loan default rate increased to 4.2% this month (up from 3.1%). 7 loans in the Ashanti region are 30+ days overdue. Immediate review recommended.',
    type: 'error',
    date: new Date(Date.now() - 10 * 3600000).toISOString(),
    read: false,
    category: 'loans',
  },
  {
    id: 'admin-n6',
    title: 'Agent Performance Review — June',
    message: 'June agent performance reports are ready. Top performer: Agent AGT-0205 (Kumasi) with 98.5% collection rate. 3 agents flagged for underperformance.',
    type: 'info',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    read: true,
    category: 'agents',
  },
  {
    id: 'admin-n7',
    title: 'Suspicious Activity Flagged',
    message: 'Unusual transaction pattern detected for user USR-0763 — multiple rapid deposits and withdrawals within 24 hours totalling ₵12,400.00. AML review required.',
    type: 'error',
    date: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    read: false,
    category: 'compliance',
  },
  {
    id: 'admin-n8',
    title: 'Susu Group Creation Approved',
    message: 'New susu group "Makola Queens" (20 members, ₵20/day) in the Accra Central branch has been approved and is now active. Treasurer: Abigail Osei.',
    type: 'success',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    read: true,
    category: 'susu',
  },
];

export const treasurerNotifications: Notification[] = [
  {
    id: 'tres-n1',
    title: 'Payout Processing — Makola Queens',
    message: 'Round 8 payout of ₵400.00 to Abena Frimpong has been initiated via MTN MoMo. Expected completion within 30 minutes. Ref: ISP-PO-4492.',
    type: 'info',
    date: new Date(Date.now() - 10 * 60000).toISOString(),
    read: false,
    category: 'payouts',
  },
  {
    id: 'tres-n2',
    title: 'Daily Collection Summary — 2 July',
    message: 'Total contributions collected today: ₵1,240.00 across 3 groups (62 members). 2 members were absent. Cash to be deposited at CBG branch by 5:00 PM.',
    type: 'success',
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
    category: 'collections',
  },
  {
    id: 'tres-n3',
    title: 'Group Round Completed — Adom Savings',
    message: 'Adom Savings Group has completed Round 10 of 10. All 15 members have received their full payouts. Group balance: ₵0.00. Ready for renewal or closure.',
    type: 'success',
    date: new Date(Date.now() - 5 * 3600000).toISOString(),
    read: false,
    category: 'groups',
  },
  {
    id: 'tres-n4',
    title: 'Payment Reminder — 3 Overdue Members',
    message: '3 members in "Nima Traders" susu group have not paid today\'s contribution (₵60.00 total outstanding). Last reminder sent 2 hours ago.',
    type: 'warning',
    date: new Date(Date.now() - 4 * 3600000).toISOString(),
    read: true,
    category: 'members',
  },
  {
    id: 'tres-n5',
    title: 'Payout Failed — Insufficient Funds',
    message: 'Payout of ₵400.00 to Efua Darkwa (Adom Savings) failed — MTN MoMo wallet has insufficient balance. Please top up and retry. Ref: ISP-PO-4491.',
    type: 'error',
    date: new Date(Date.now() - 7 * 3600000).toISOString(),
    read: false,
    category: 'payouts',
  },
  {
    id: 'tres-n6',
    title: 'New Member Onboarded',
    message: 'Grace Owusu has been added to "Makola Queens" susu group. The group now has 19 of 20 slots filled. She will start contributing from Round 9.',
    type: 'info',
    date: new Date(Date.now() - 12 * 3600000).toISOString(),
    read: true,
    category: 'members',
  },
  {
    id: 'tres-n7',
    title: 'Weekly Report Ready',
    message: 'Your weekly treasury report (23–29 June) is ready for review. Total pool: ₵8,600.00, disbursements: ₵6,200.00, outstanding: ₵2,400.00.',
    type: 'info',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    read: true,
    category: 'reports',
  },
  {
    id: 'tres-n8',
    title: 'Cash Deposit Confirmation',
    message: 'Your cash deposit of ₵2,480.00 at CBG Labadi branch has been confirmed. Reference: CBG-DEP-99203. Available balance updated.',
    type: 'success',
    date: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    read: true,
    category: 'collections',
  },
];

// Helper to get initial mock data for a portal
function getInitialNotifications(portal: string): Notification[] {
  switch (portal) {
    case 'agent':
      return agentNotifications;
    case 'admin':
      return adminNotifications;
    case 'treasurer':
      return treasurerNotifications;
    default:
      return [];
  }
}

// ---- Props ----

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  portal: string;
}

// ---- Component ----

export function NotificationPanel({ open, onClose, portal }: NotificationPanelProps) {
  // Customer portal: use Zustand store (existing behaviour)
  const storeNotifications = useCustomerStore((s) => s.notifications);
  const markNotificationRead = useCustomerStore((s) => s.markNotificationRead);

  // Non-customer portals: use local state initialised from mock data
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(() =>
    getInitialNotifications(portal),
  );

  const isCustomerPortal = portal === 'customer';
  const displayNotifications = isCustomerPortal ? storeNotifications : localNotifications;
  const unreadCount = displayNotifications.filter((n) => !n.read).length;

  // ---- Selected notification for detail view ----
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // When the portal changes, reset local mock data
  React.useEffect(() => {
    if (!isCustomerPortal) {
      setLocalNotifications(getInitialNotifications(portal));
    }
  }, [portal, isCustomerPortal]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Mark as read
      if (isCustomerPortal) {
        markNotificationRead(notification.id);
      } else {
        setLocalNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        );
      }
      // Open detail dialog
      setSelectedNotification({ ...notification, read: true });
    },
    [isCustomerPortal, markNotificationRead],
  );

  const handleMarkAllRead = useCallback(() => {
    if (isCustomerPortal) {
      const unreadIds = storeNotifications
        .filter((n) => !n.read)
        .map((n) => n.id);
      for (const id of unreadIds) {
        markNotificationRead(id);
      }
    } else {
      setLocalNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true })),
      );
    }
  }, [isCustomerPortal, storeNotifications, markNotificationRead]);

  // Memoize the portal label for the empty-state heading
  const portalLabel = useMemo(() => {
    const labels: Record<string, string> = {
      customer: 'Customer',
      agent: 'Agent',
      admin: 'Admin',
      treasurer: 'Treasurer',
    };
    return labels[portal] ?? portal;
  }, [portal]);

  return (
    <MobileDrawer open={open} onClose={onClose}>
      <div className="flex h-full flex-col">
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="touch-target flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ---- Mark all as read ---- */}
        {unreadCount > 0 && (
          <div className="border-b px-4 py-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          </div>
        )}

        {/* ---- Notification list ---- */}
        <ScrollArea className="flex-1">
          {displayNotifications.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted dark:bg-muted/50">
                <Bell className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isCustomerPortal
                  ? "You're all caught up!"
                  : `${portalLabel} notifications will appear here.`}
              </p>
            </div>
          ) : (
            /* Notification items */
            <div className="max-h-[calc(100dvh-140px)] py-1">
              {displayNotifications.map((notification) => {
                const { icon: Icon, color, bg, label } = getNotificationTypeConfig(notification.type);
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 cursor-pointer touch-manipulation ${
                      !notification.read ? 'bg-muted/50 dark:bg-muted/30' : ''
                    }`}
                  >
                    {/* Type icon */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5 ${bg}`}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Title row with badge and unread dot */}
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm truncate ${
                            notification.read
                              ? 'font-medium text-muted-foreground'
                              : 'font-semibold text-foreground'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`shrink-0 text-[10px] px-1.5 py-0 font-medium ${bg} ${color} border-0`}
                        >
                          {label}
                        </Badge>
                        {!notification.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>

                      {/* Message */}
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {notification.message}
                      </p>

                      {/* Time ago */}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatTimeAgo(notification.date)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ---- Notification Detail Dialog ---- */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => {
          if (!open) setSelectedNotification(null);
        }}
      >
        {selectedNotification && (() => {
          const { icon: Icon, color, bg, label } = getNotificationTypeConfig(selectedNotification.type);
          return (
            <DialogContent className="mx-4 sm:mx-0 sm:max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base leading-snug">
                      {selectedNotification.title}
                    </DialogTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 font-medium border-0 ${bg} ${color}`}
                      >
                        {label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatTimeAgo(selectedNotification.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Full message */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {selectedNotification.message}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">Category</p>
                    <p className="capitalize font-medium text-foreground">
                      {selectedNotification.category}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">Date &amp; Time</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(selectedNotification.date), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                </div>

                {selectedNotification.link && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      window.open(selectedNotification.link, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Details
                  </Button>
                )}
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </MobileDrawer>
  );
}
