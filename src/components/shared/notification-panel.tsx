'use client';

import React from 'react';
import { useCustomerStore } from '@/store/app-store';
import { MobileDrawer } from '@/components/shared/mobile-components';
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

// ---- Props ----

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  portal: string;
}

// ---- Component ----

export function NotificationPanel({ open, onClose, portal }: NotificationPanelProps) {
  const notifications = useCustomerStore((s) => s.notifications);
  const markNotificationRead = useCustomerStore((s) => s.markNotificationRead);

  const isCustomerPortal = portal === 'customer';
  const displayNotifications = isCustomerPortal ? notifications : [];
  const unreadCount = displayNotifications.filter((n) => !n.read).length;

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAllRead = () => {
    const unreadIds = displayNotifications
      .filter((n) => !n.read)
      .map((n) => n.id);

    for (const id of unreadIds) {
      markNotificationRead(id);
    }
  };

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
          {!isCustomerPortal ? (
            /* Non-customer portal placeholder */
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Bell className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No notifications
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Notifications are not available for this portal
              </p>
            </div>
          ) : displayNotifications.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted dark:bg-muted/50">
                <Bell className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You&apos;re all caught up!
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
                    onClick={() => handleNotificationClick(notification.id)}
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
    </MobileDrawer>
  );
}
