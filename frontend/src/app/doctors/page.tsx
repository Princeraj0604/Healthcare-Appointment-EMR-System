'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { doctorApi } from '@/services/index';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, getInitials } from '@/lib/utils';
import {
  Search,
  Star,
  MapPin,
  Stethoscope,
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
  IndianRupee,
} from 'lucide-react';

const specializationsList = [
  'All Specializations',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Ophthalmology',
  'General Medicine',
  'Dermatology',
  'Gynecology',
];

export default function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('All Specializations');
  const [maxFee, setMaxFee] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, specialization, maxFee, minRating],
    queryFn: () =>
      doctorApi.getDoctors({
        search: search || undefined,
        specialization: specialization === 'All Specializations' ? undefined : specialization,
        maxFee: maxFee || undefined,
        minRating: minRating || undefined,
      }),
  });

  const doctors = data?.data || [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Find & Book Top Doctors
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified medical specialists, view time slots, and schedule consultations.
          </p>

          {/* Quick Search Bar */}
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by doctor name, clinic address, or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-5 rounded-2xl border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4 text-blue-600" /> Filter Doctors
                </span>
                <button
                  onClick={() => {
                    setSearch('');
                    setSpecialization('All Specializations');
                    setMaxFee(undefined);
                    setMinRating(undefined);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Specialization Filter */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Specialization
                </label>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1 text-sm">
                  {specializationsList.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSpecialization(spec)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                        specialization === spec
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Consultation Fee */}
              <div className="space-y-2 pt-4 border-t border-slate-100 mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex justify-between">
                  <span>Max Fee (INR)</span>
                  {maxFee && <span className="text-blue-600 font-bold">₹{maxFee}</span>}
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={maxFee || ''}
                  onChange={(e) => setMaxFee(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-10"
                />
              </div>

              {/* Minimum Rating */}
              <div className="space-y-2 pt-4 border-t border-slate-100 mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Minimum Rating
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setMinRating(minRating === r ? undefined : r)}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-semibold ${
                        minRating === r
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{r}★</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Doctor Cards Grid */}
          <div className="lg:col-span-3 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 rounded-2xl animate-pulse bg-white border-slate-200">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-slate-200 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-5 w-48 bg-slate-200 rounded-md" />
                        <div className="h-4 w-32 bg-slate-100 rounded-md" />
                        <div className="h-4 w-64 bg-slate-100 rounded-md" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <Card className="p-12 text-center rounded-2xl bg-white border-slate-200 space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Doctors Found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search query or reset filters to discover certified specialists.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setSpecialization('All Specializations');
                    setMaxFee(undefined);
                    setMinRating(undefined);
                  }}
                  className="rounded-xl mt-2"
                >
                  Reset All Filters
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor: any) => (
                  <Card
                    key={doctor.id}
                    className="p-6 rounded-2xl border-slate-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 rounded-2xl bg-blue-100 text-blue-700 text-xl shrink-0">
                          {getInitials(doctor.user.name)}
                        </Avatar>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">
                              <Link href={`/doctors/${doctor.id}`}>
                                Dr. {doctor.user.name}
                              </Link>
                            </h3>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold text-xs">
                              {doctor.specialization}
                            </Badge>
                          </div>

                          <p className="text-xs text-slate-500 font-medium">{doctor.qualification}</p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {doctor.experience} Years Experience
                            </span>

                            <span className="flex items-center gap-1 font-semibold text-amber-600">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {doctor.avgRating ? Number(doctor.avgRating).toFixed(1) : 'New'}
                              <span className="text-slate-400 font-normal">
                                ({doctor.totalReviews || 0} reviews)
                              </span>
                            </span>

                            {doctor.clinicAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {doctor.clinicAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Fee & Book Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-400 block">Consultation Fee</span>
                          <span className="text-xl font-bold text-slate-900">
                            {formatCurrency(Number(doctor.consultationFee))}
                          </span>
                        </div>

                        <Link href={`/doctors/${doctor.id}`}>
                          <Button className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl px-5 shadow-sm">
                            <Calendar className="h-4 w-4 mr-1.5" /> Book Slot
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
