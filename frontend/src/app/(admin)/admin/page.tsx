'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/index';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  Stethoscope,
  Calendar,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  return (
    <DashboardLayout requiredRole="ADMIN">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Administration & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time platform metrics, doctor verification status, and financial revenue.
          </p>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Total Doctors</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalDoctors || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Appointments</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalAppointments || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <IndianRupee className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(Number(stats?.totalRevenue || 0))}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-2xl border-slate-200 bg-white">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <span>Doctor Verification Approvals</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Verify credentials, license numbers, and qualifications of newly registered doctors before making them public.
            </p>
            <Link href="/admin/doctors">
              <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-xl">
                Manage Doctor Approvals ({stats?.pendingApprovalDoctors || 0} Pending)
              </Button>
            </Link>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200 bg-white">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>System User Directory</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              View registered patients, doctors, active sessions, and access permissions across the system.
            </p>
            <Link href="/admin/users">
              <Button variant="outline" className="text-xs font-semibold rounded-xl">
                Browse All Users
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
