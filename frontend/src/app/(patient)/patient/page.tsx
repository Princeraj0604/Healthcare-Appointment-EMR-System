'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi, medicalRecordApi } from '@/services/index';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, formatDateTime, getInitials, getStatusColor, formatCurrency } from '@/lib/utils';
import {
  Calendar,
  FileText,
  Clock,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Plus,
  Activity,
} from 'lucide-react';

export default function PatientDashboardPage() {
  const { user } = useAuthStore();

  // Fetch Patient Appointments
  const { data: appointmentsData, isLoading: appLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => appointmentApi.getMyAppointments({ limit: '5' }),
  });

  // Fetch Patient Records
  const { data: recordsData } = useQuery({
    queryKey: ['patient-records', user?.id],
    queryFn: () => medicalRecordApi.getPatientHistory(user?.id || ''),
    enabled: !!user?.id,
  });

  const appointments = appointmentsData?.data || [];
  const records = recordsData?.data || [];

  const upcomingAppointment = appointments.find(
    (a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED'
  );

  return (
    <DashboardLayout requiredRole="PATIENT">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-blue-600/10">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name} 👋
            </h1>
            <p className="text-blue-100 text-sm">
              Welcome to your digital healthcare hub. Book specialists and view medical records.
            </p>
          </div>
          <Link href="/doctors">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 h-11 rounded-xl shadow-md">
              <Plus className="h-4 w-4 mr-1.5" /> Book Appointment
            </Button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Medical Records</p>
                <p className="text-2xl font-bold text-slate-900">{records.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Next Visit</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {upcomingAppointment ? formatDate(upcomingAppointment.scheduledAt) : 'No upcoming visit'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Appointments & Prescriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming / Recent Appointments */}
          <Card className="rounded-2xl border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>My Appointments</span>
              </CardTitle>
              <Link href="/patient/appointments" className="text-xs font-semibold text-blue-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {appLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No appointments booked yet.
                </div>
              ) : (
                appointments.slice(0, 3).map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-blue-100 text-blue-700 text-sm font-bold">
                        {getInitials(app.doctor?.user?.name || 'Dr')}
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Dr. {app.doctor?.user?.name}</h4>
                        <p className="text-xs text-slate-500">{formatDateTime(app.scheduledAt)}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] font-bold border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Digital Medical Records */}
          <Card className="rounded-2xl border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Recent Prescriptions & EMR</span>
              </CardTitle>
              <Link href="/patient/records" className="text-xs font-semibold text-blue-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {records.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No medical records uploaded yet.
                </div>
              ) : (
                records.slice(0, 3).map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{rec.diagnosis}</span>
                      <span className="text-xs text-slate-400">{formatDate(rec.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {rec.prescription || 'Standard clinical consultation notes attached.'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
