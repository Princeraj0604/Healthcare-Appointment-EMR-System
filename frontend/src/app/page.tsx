'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Calendar,
  ShieldCheck,
  Zap,
  Activity,
  Heart,
  Brain,
  Eye,
  Bone,
  Baby,
  Stethoscope,
  Star,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const specialties = [
  { name: 'Cardiology', icon: Heart, count: '120+ Doctors', color: 'bg-rose-50 text-rose-600' },
  { name: 'Neurology', icon: Brain, count: '85+ Doctors', color: 'bg-purple-50 text-purple-600' },
  { name: 'Orthopedics', icon: Bone, count: '110+ Doctors', color: 'bg-amber-50 text-amber-600' },
  { name: 'Pediatrics', icon: Baby, count: '95+ Doctors', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Ophthalmology', icon: Eye, count: '60+ Doctors', color: 'bg-blue-50 text-blue-600' },
  { name: 'General Medicine', icon: Stethoscope, count: '240+ Doctors', color: 'bg-indigo-50 text-indigo-600' },
];

const features = [
  {
    title: 'Zero Double-Booking Guarantee',
    description: 'Powered by distributed Redis slot locking, ensuring you never face conflicting appointment schedules.',
    icon: Zap,
  },
  {
    title: 'Instant Online & In-Person Visits',
    description: 'Book verified doctor consultations in under 60 seconds with automated instant confirmations.',
    icon: Calendar,
  },
  {
    title: 'Encrypted Digital Health Records',
    description: 'Lifetime access to your digital prescriptions, diagnoses, and lab reports securely encrypted.',
    icon: ShieldCheck,
  },
  {
    title: 'Seamless Razorpay Payments',
    description: 'Pay consultation fees securely with UPI, Credit/Debit cards, or Net Banking with instant receipts.',
    icon: Activity,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/doctors');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white py-16 sm:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Next-Gen Healthcare & EMR Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Find Trusted Doctors & Book Appointments{' '}
              <span className="text-blue-600 underline decoration-blue-200 decoration-wavy">Instantly.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Connect with top certified medical specialists. Experience frictionless appointment booking with real-time slot locking and paperless EMR records.
            </p>

            {/* Quick Search Form */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-blue-500/5 border border-slate-200"
            >
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search doctor by name, specialty, or condition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-0 shadow-none text-base focus-visible:ring-0"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 text-base font-semibold rounded-xl shadow-md shadow-blue-600/20">
                Find Doctors
              </Button>
            </form>

            {/* Key Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>100% Verified Specialists</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Zero Double-Booking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Instant Confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="py-16 bg-slate-50 border-y border-slate-200/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Explore Popular Specialties
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Consult with verified healthcare specialists across diverse clinical disciplines.
              </p>
            </div>
            <Link href="/doctors">
              <Button variant="ghost" className="text-blue-600 font-semibold gap-1.5 hover:bg-blue-50">
                View All Doctors <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={`/doctors?specialization=${encodeURIComponent(item.name)}`}
                  className="group"
                >
                  <Card className="h-full border-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 text-center p-5 rounded-2xl bg-white">
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{item.count}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose PulseCare Features */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
            <Badge variant="secondary" className="font-semibold text-blue-700 bg-blue-50">
              Why PulseCare
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Engineered for Clinical Precision & Seamless Care
            </h2>
            <p className="text-slate-500 text-base">
              A modern digital healthcare infrastructure designed to eliminate wait times and empower patients and doctors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Are You a Doctor or Healthcare Provider?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto text-base">
            Manage your daily patient queue, set custom availability templates, and issue digital prescriptions with zero paperwork.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register?role=DOCTOR">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 h-12 rounded-xl shadow-lg">
                Join as a Doctor
              </Button>
            </Link>
            <Link href="/doctors">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold px-8 h-12 rounded-xl">
                Book a Specialist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
