import React from 'react';
import Link from 'next/link';
import { HeartPulse, Shield, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                PulseCare<span className="text-blue-500">.</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Next-generation Electronic Medical Records (EMR) & Real-time Healthcare Appointment Platform designed for modern hospitals and clinics.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Shield className="h-4 w-4" />
              <span>HIPAA Compliant & End-to-End Encrypted</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Patients</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/doctors" className="hover:text-blue-400 transition-colors">
                  Find a Doctor
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-400 transition-colors">
                  Book an Appointment
                </Link>
              </li>
              <li>
                <Link href="/patient/records" className="hover:text-blue-400 transition-colors">
                  Medical Records & Prescriptions
                </Link>
              </li>
              <li>
                <Link href="/doctors?specialization=Cardiology" className="hover:text-blue-400 transition-colors">
                  Cardiology Specialists
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Doctors */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Doctors & Staff</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register?role=DOCTOR" className="hover:text-blue-400 transition-colors">
                  Join as a Doctor
                </Link>
              </li>
              <li>
                <Link href="/doctor" className="hover:text-blue-400 transition-colors">
                  Doctor Portal & Queue
                </Link>
              </li>
              <li>
                <Link href="/doctor/availability" className="hover:text-blue-400 transition-colors">
                  Availability Management
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-blue-400 transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Help */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Support & Emergency</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>24/7 Helpline: +91 (800) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>support@pulsecare-emr.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Cyber City, Phase 2, Gurugram, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PulseCare Healthcare Systems Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-400">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-400">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-400">Security Standards</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
