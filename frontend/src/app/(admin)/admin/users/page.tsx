'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/index';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, getInitials } from '@/lib/utils';
import { Users, Shield, CheckCircle2, XCircle } from 'lucide-react';

const roleFilters = ['ALL', 'PATIENT', 'DOCTOR', 'ADMIN'];

export default function AdminUsersPage() {
  const [activeRole, setActiveRole] = useState('ALL');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users-list', activeRole],
    queryFn: () =>
      adminApi.getUsers({
        role: activeRole === 'ALL' ? undefined : activeRole,
      }),
  });

  const users = usersData?.data || [];

  return (
    <DashboardLayout requiredRole="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Directory of registered patients, medical specialists, and administrators.</p>
        </div>

        {/* Role Filters */}
        <div className="flex gap-2">
          {roleFilters.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeRole === r
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Users Table */}
        <Card className="rounded-2xl border-slate-200 bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading user accounts...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Verified Email</th>
                    <th className="p-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 bg-slate-100 text-slate-700 font-bold">
                            {getInitials(u.name)}
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'DOCTOR'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {u.role}
                        </Badge>
                      </td>

                      <td className="p-4">
                        {u.isVerified ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <XCircle className="h-4 w-4" /> Unverified
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
