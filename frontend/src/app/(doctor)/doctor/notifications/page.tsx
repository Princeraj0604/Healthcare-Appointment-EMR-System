'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/index';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { Bell, CheckCheck, Circle } from 'lucide-react';

export default function DoctorNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-notifications'],
    queryFn: () => notificationApi.getNotifications(),
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    queryClient.invalidateQueries({ queryKey: ['doctor-notifications'] });
  };

  const handleMarkRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ['doctor-notifications'] });
  };

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Doctor Notifications</h1>
            <p className="text-sm text-slate-500 mt-0.5">Real-time alerts for new bookings and patient cancellations.</p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold gap-1.5 rounded-xl"
            >
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 rounded-2xl animate-pulse bg-white border-slate-200">
                <div className="h-12 bg-slate-100 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl bg-white border-slate-200">
            <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Notifications</h3>
            <p className="text-xs text-slate-400 mt-1">You have no new alerts.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif: any) => (
              <Card
                key={notif.id}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
                  notif.isRead ? 'bg-white border-slate-200' : 'bg-blue-50/50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!notif.isRead && <Circle className="h-2.5 w-2.5 fill-blue-600 text-blue-600 shrink-0" />}
                      <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <span className="text-[11px] text-slate-400 block pt-1">{formatDateTime(notif.createdAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
