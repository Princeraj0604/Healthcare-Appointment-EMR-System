'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, medicalRecordApi } from '@/services/index';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDateTime, getInitials, getStatusColor } from '@/lib/utils';
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  XCircle,
} from 'lucide-react';

const statusTabs = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function DoctorAppointmentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ALL');

  // Medical Record / Prescription Modal State
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments-full', activeTab],
    queryFn: () =>
      appointmentApi.getMyAppointments({
        status: activeTab === 'ALL' ? undefined : activeTab,
      }),
  });

  const appointments = data?.data || [];

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      await appointmentApi.updateStatus(appointmentId, status);
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments-full'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleOpenPrescriptionModal = (app: any) => {
    setSelectedApp(app);
    setDiagnosis('');
    setPrescription('');
    setNotes('');
    setFollowUpDate('');
    setRecordError(null);
    setRecordModalOpen(true);
  };

  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !diagnosis.trim()) return;

    setRecordLoading(true);
    setRecordError(null);

    try {
      await medicalRecordApi.createRecord({
        appointmentId: selectedApp.id,
        diagnosis,
        prescription,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      });

      setRecordModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments-full'] });
    } catch (err: any) {
      setRecordError(err.response?.data?.message || 'Failed to submit medical record');
    } finally {
      setRecordLoading(false);
    }
  };

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Consultations Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review patient requests, confirm appointments, and issue digital prescriptions.</p>
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
            <h3 className="text-base font-bold text-slate-900">No Patient Appointments</h3>
            <p className="text-xs text-slate-400 mt-1">No appointments found matching this status.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((app: any) => (
              <Card key={app.id} className="p-6 rounded-2xl border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-700 text-lg font-bold shrink-0">
                      {getInitials(app.patient?.user?.name || 'P')}
                    </Avatar>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{app.patient?.user?.name}</h3>
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
                        {app.symptoms && ` • Reported Symptoms: "${app.symptoms}"`}
                      </p>
                    </div>
                  </div>

                  {/* Doctor Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {app.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(app.id, 'CONFIRMED')}
                        className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-xl"
                      >
                        Confirm Visit
                      </Button>
                    )}

                    {app.status === 'CONFIRMED' && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPrescriptionModal(app)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                      >
                        <FileText className="h-4 w-4 mr-1" /> Add Prescription & Complete
                      </Button>
                    )}

                    {app.status === 'COMPLETED' && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                        Consultation Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Prescription / EMR Entry Modal */}
      <Dialog open={recordModalOpen} onOpenChange={setRecordModalOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <Stethoscope className="h-6 w-6" />
            <span>Digital Medical Record & Prescription</span>
          </DialogTitle>
          <DialogDescription>
            Patient: <strong>{selectedApp?.patient?.user?.name}</strong>. Entering this record will automatically mark the appointment as COMPLETED.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveMedicalRecord} className="space-y-4 pt-2">
          {recordError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{recordError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="diag">Clinical Diagnosis *</Label>
            <Input
              id="diag"
              required
              placeholder="e.g. Acute Viral Bronchitis / Hypertension Stage 1"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="presc">Prescription & Medication Dosage</Label>
            <Textarea
              id="presc"
              placeholder="1. Tab Paracetamol 650mg — 1 tab tid x 3 days&#10;2. Syrup CoughRelief 10ml — bid x 5 days"
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              className="h-28 font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Clinical Notes / Dietary Advice</Label>
            <Textarea
              id="notes"
              placeholder="Adequate hydration, avoid strenuous exertion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="followup">Recommended Follow-up Date (Optional)</Label>
            <Input
              id="followup"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="h-11"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={recordLoading || !diagnosis.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {recordLoading ? 'Saving EMR Record...' : 'Complete Visit & Save Record'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
