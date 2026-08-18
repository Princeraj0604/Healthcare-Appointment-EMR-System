'use client';

import React, { useState } from 'react';
import { doctorApi } from '@/services/index';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle2, AlertCircle, Save } from 'lucide-react';

const daysList = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export default function DoctorAvailabilityPage() {
  const [schedules, setSchedules] = useState<any[]>(
    daysList.map((day) => ({
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      breakStart: '13:00',
      breakEnd: '14:00',
      isActive: day !== 'SUNDAY', // Active Mon-Sat by default
    }))
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggleDay = (index: number) => {
    const updated = [...schedules];
    updated[index].isActive = !updated[index].isActive;
    setSchedules(updated);
  };

  const handleFieldChange = (index: number, field: string, value: any) => {
    const updated = [...schedules];
    updated[index][field] = value;
    setSchedules(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await doctorApi.setAvailability(schedules);
      setMessage({ type: 'success', text: 'Weekly availability schedule saved successfully!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update schedule. Ensure start time is earlier than end time.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly Availability Schedule</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Set your active consulting days, working hours, and lunch break intervals.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 font-semibold gap-1.5 rounded-xl shadow-sm"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2.5 rounded-xl p-3.5 text-sm border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {schedules.map((schedule, idx) => (
            <Card
              key={schedule.dayOfWeek}
              className={`p-5 rounded-2xl border transition-all ${
                schedule.isActive ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Day Toggle */}
                <div className="flex items-center gap-3 w-40">
                  <input
                    type="checkbox"
                    checked={schedule.isActive}
                    onChange={() => handleToggleDay(idx)}
                    id={`toggle-${schedule.dayOfWeek}`}
                    className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <Label htmlFor={`toggle-${schedule.dayOfWeek}`} className="font-bold text-sm text-slate-900 cursor-pointer">
                    {schedule.dayOfWeek}
                  </Label>
                </div>

                {/* Hours Configuration */}
                {schedule.isActive ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Start Time</span>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => handleFieldChange(idx, 'startTime', e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">End Time</span>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => handleFieldChange(idx, 'endTime', e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Break Start</span>
                      <Input
                        type="time"
                        value={schedule.breakStart || ''}
                        onChange={(e) => handleFieldChange(idx, 'breakStart', e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Break End</span>
                      <Input
                        type="time"
                        value={schedule.breakEnd || ''}
                        onChange={(e) => handleFieldChange(idx, 'breakEnd', e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Day Off (No Consultations)</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
