'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, doctorApi } from '@/services/index';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, getInitials } from '@/lib/utils';
import { ShieldCheck, CheckCircle2, XCircle, Stethoscope } from 'lucide-react';

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-doctors-list'],
    queryFn: () => adminApi.getUsers({ role: 'DOCTOR' }),
  });

  const doctors = usersData?.data || [];

  const handleToggleApproval = async (doctorId: string, currentStatus: boolean) => {
    try {
      await adminApi.approveDoctor(doctorId, !currentStatus);
      queryClient.invalidateQueries({ queryKey: ['admin-doctors-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update approval status');
    }
  };

  return (
    <DashboardLayout requiredRole="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Verification Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Approve or revoke doctor profiles to enable/disable public appointment bookings.
          </p>
        </div>

        <Card className="rounded-2xl border-slate-200 bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading doctor records...</div>
          ) : doctors.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No doctors found in the database.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((userDoc: any) => {
                    const docProfile = userDoc.doctor;
                    const isApproved = docProfile?.isApproved;

                    return (
                      <tr key={userDoc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-blue-100 text-blue-700 font-bold">
                              {getInitials(userDoc.name)}
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-900">Dr. {userDoc.name}</p>
                              <p className="text-xs text-slate-400">{userDoc.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold text-xs">
                            {docProfile?.specialization || 'General'}
                          </Badge>
                        </td>

                        <td className="p-4">
                          {isApproved ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                              Verified & Public
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold">
                              Pending Approval
                            </Badge>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {docProfile && (
                            <Button
                              size="sm"
                              variant={isApproved ? 'outline' : 'default'}
                              onClick={() => handleToggleApproval(docProfile.id, isApproved)}
                              className={`text-xs font-semibold rounded-xl ${
                                isApproved
                                  ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isApproved ? 'Revoke Approval' : 'Approve Doctor'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
