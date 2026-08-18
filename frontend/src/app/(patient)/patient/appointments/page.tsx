'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '@/services/index';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime, getInitials, getStatusColor } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

const statusTabs = ['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'];

export default function PatientAppointmentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ALL');

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['patient-appointments-list', activeTab],
    queryFn: () =>
      appointmentApi.getMyAppointments({
        status: activeTab === 'ALL' ? undefined : activeTab,
      }),
  });

  const appointments = data?.data || [];

  const handleOpenCancel = (id: string) => {
    setSelectedAppId(id);
    setCancelReason('');
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !cancelReason.trim()) return;

    setCancelLoading(true);
    setCancelError(null);

    try {
      await appointmentApi.cancelAppointment(selectedAppId, cancelReason);
      setCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['patient-appointments-list'] });
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <DashboardLayout requiredRole="PATIENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your upcoming and completed doctor consultations.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 rounded-2xl animate-pulse bg-white border-slate-200">
                <div className="h-16 bg-slate-100 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl bg-white border-slate-200">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Appointments Found</h3>
            <p className="text-xs text-slate-400 mt-1">There are no appointments matching this status.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((app: any) => (
              <Card key={app.id} className="p-6 rounded-2xl border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-700 text-lg font-bold shrink-0">
                      {getInitials(app.doctor?.user?.name || 'Dr')}
                    </Avatar>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Dr. {app.doctor?.user?.name}
                        </h3>
                        <Badge className={`text-[10px] font-bold border ${getStatusColor(app.status)}`}>
                          {app.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatDateTime(app.scheduledAt)} ({app.duration || 30} mins)
                      </p>

                      <p className="text-xs text-slate-400">
                        Type: <span className="font-semibold text-slate-700">{app.type}</span>
                        {app.symptoms && ` • Symptoms: ${app.symptoms}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {(app.status === 'PENDING' || app.status === 'CONFIRMED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCancel(app.id)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold rounded-xl"
                      >
                        Cancel Visit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Reason Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <XCircle className="h-6 w-6" />
            <span>Cancel Appointment</span>
          </DialogTitle>
          <DialogDescription>
            Please provide a brief cancellation reason for the clinic records.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirmCancel} className="space-y-4 pt-2">
          {cancelError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Reason for Cancellation</label>
            <Textarea
              required
              placeholder="e.g. Rescheduling conflict or emergency..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="h-20"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={cancelLoading || !cancelReason.trim()}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
