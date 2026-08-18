'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { medicalRecordApi } from '@/services/index';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { formatDate, getInitials } from '@/lib/utils';
import {
  FileText,
  Calendar,
  Stethoscope,
  Download,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function PatientRecordsPage() {
  const { user } = useAuthStore();
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['patient-records-full', user?.id],
    queryFn: () => medicalRecordApi.getPatientHistory(user?.id || ''),
    enabled: !!user?.id,
  });

  const records = data?.data || [];

  return (
    <DashboardLayout requiredRole="PATIENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical History & EMR Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Access your encrypted clinical diagnoses, digital prescriptions, and lab reports.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 rounded-2xl animate-pulse bg-white border-slate-200">
                <div className="h-16 bg-slate-100 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : records.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl bg-white border-slate-200">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Medical Records Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your prescriptions and clinical notes will appear here following completed consultations.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((rec: any) => (
              <Card key={rec.id} className="p-6 rounded-2xl border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{rec.diagnosis}</h3>
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                        {formatDate(rec.createdAt)}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                      Consulting Doctor: <span className="font-semibold text-slate-700">Dr. {rec.doctor?.user?.name || 'Specialist'}</span>
                    </p>

                    {rec.followUpDate && (
                      <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Recommended Follow-up: {formatDate(rec.followUpDate)}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRecord(rec)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold rounded-xl text-xs"
                  >
                    View Prescription
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Detail Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        {selectedRecord && (
          <div>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <span>Clinical Record & Prescription</span>
              </DialogTitle>
              <DialogDescription>
                Issued by <strong>Dr. {selectedRecord.doctor?.user?.name || 'Specialist'}</strong> on{' '}
                {formatDate(selectedRecord.createdAt)}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Diagnosis</span>
                <p className="font-semibold text-slate-900 text-base">{selectedRecord.diagnosis}</p>
              </div>

              {selectedRecord.prescription && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Prescription & Medication</span>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedRecord.prescription}</p>
                </div>
              )}

              {selectedRecord.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Doctor Advice / Notes</span>
                  <p className="text-slate-600 leading-relaxed">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
