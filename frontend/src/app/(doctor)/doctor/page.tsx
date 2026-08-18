'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi } from '@/services/index';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, formatDateTime, getInitials, getStatusColor } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Plus,
} from 'lucide-react';

export default function DoctorDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-dashboard-appointments'],
    queryFn: () => appointmentApi.getMyAppointments({ limit: '10' }),
  });

  const appointments = data?.data || [];

  const pendingCount = appointments.filter((a: any) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a: any) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a: any) => a.status === 'COMPLETED').length;

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-blue-700/10">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, Dr. {user?.name} 🩺
            </h1>
            <p className="text-blue-100 text-sm">
              Manage your clinical schedule, consult queue, and electronic medical records.
            </p>
          </div>
          <Link href="/doctor/availability">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 h-11 rounded-xl shadow-md">
              <Clock className="h-4 w-4 mr-1.5" /> Manage Availability
            </Button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Pending Requests</p>
                <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Confirmed Visits</p>
                <p className="text-2xl font-bold text-slate-900">{confirmedCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Completed Consults</p>
                <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Patient Appointment Queue */}
        <Card className="rounded-2xl border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Upcoming Patient Consultations</span>
            </CardTitle>
            <Link href="/doctor/appointments" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Queue
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No patient consultations scheduled for today.
              </div>
            ) : (
              appointments.slice(0, 5).map((app: any) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 bg-blue-100 text-blue-700 text-sm font-bold">
                      {getInitials(app.patient?.user?.name || 'P')}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{app.patient?.user?.name}</h4>
                        <Badge className={`text-[10px] font-bold border ${getStatusColor(app.status)}`}>
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{formatDateTime(app.scheduledAt)}</p>
                      {app.symptoms && (
                        <p className="text-xs text-slate-600 italic mt-0.5">&ldquo;{app.symptoms}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  <Link href="/doctor/appointments">
                    <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl w-full sm:w-auto">
                      Manage Visit
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
