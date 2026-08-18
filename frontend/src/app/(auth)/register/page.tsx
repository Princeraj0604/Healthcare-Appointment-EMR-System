'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { HeartPulse, Lock, Mail, User, Phone, Stethoscope, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Doctor Specific Fields
  const [specialization, setSpecialization] = useState('General Medicine');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [experience, setExperience] = useState(5);
  const [consultationFee, setConsultationFee] = useState(500);
  const [registrationNumber, setRegistrationNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? phone.trim() : undefined,
        password,
        role,
        ...(role === 'DOCTOR' && {
          specialization: specialization.trim(),
          qualification: qualification.trim(),
          experience: Number(experience),
          consultationFee: Number(consultationFee),
          registrationNumber: registrationNumber.trim(),
        }),
      });

      // Open OTP modal upon successful registration
      setOtpModalOpen(true);
    } catch (err: any) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const fieldErrors = err.response.data.errors.map((e: any) => e.message).join(' • ');
        setError(fieldErrors || 'Validation failed');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please verify your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setOtpLoading(true);

    try {
      await authApi.verifyOTP(email, otp);
      setOtpSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            <HeartPulse className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            PulseCare<span className="text-blue-600">.</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Your Account</h1>
        <p className="text-sm text-slate-500">Join PulseCare as a patient or registered medical specialist.</p>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setRole('PATIENT')}
          className={`py-2.5 text-sm font-semibold rounded-xl transition-all ${
            role === 'PATIENT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          I am a Patient
        </button>
        <button
          type="button"
          onClick={() => setRole('DOCTOR')}
          className={`py-2.5 text-sm font-semibold rounded-xl transition-all ${
            role === 'DOCTOR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          I am a Doctor
        </button>
      </div>

      {/* Register Card */}
      <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl bg-white">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    required
                    placeholder={role === 'DOCTOR' ? 'Dr. Jane Smith' : 'John Doe'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password (min 8 chars, 1 uppercase, 1 symbol)</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Doctor Specific Fields */}
            {role === 'DOCTOR' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      required
                      placeholder="e.g. Cardiology"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input
                      id="qualification"
                      required
                      placeholder="e.g. MBBS, MD"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      required
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="consultationFee">Fee (₹ INR)</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      min="0"
                      required
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(Number(e.target.value))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="regNumber">Medical License #</Label>
                    <Input
                      id="regNumber"
                      required
                      placeholder="MCI-12345"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-semibold rounded-xl shadow-md shadow-blue-600/20"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </Button>

            <div className="text-center text-sm text-slate-500">
              Already registered?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* OTP Email Verification Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span>Verify Your Email</span>
          </DialogTitle>
          <DialogDescription>
            We have sent a 6-digit verification code to <strong>{email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerifyOTP} className="space-y-4 pt-2">
          {otpError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {otpSuccess ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Email verified successfully! Redirecting to sign in...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp">Enter 6-Digit OTP</Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-12 text-center text-2xl font-bold tracking-widest"
              />
            </div>
          )}

          <DialogFooter>
            {!otpSuccess && (
              <Button type="submit" disabled={otpLoading || otp.length < 6} className="w-full bg-blue-600 h-11">
                {otpLoading ? 'Verifying...' : 'Verify & Activate Account'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
