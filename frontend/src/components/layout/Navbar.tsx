'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HeartPulse, 
  Calendar, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Stethoscope, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'DOCTOR') return '/doctor';
    if (user.role === 'ADMIN') return '/admin';
    return '/patient';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              PulseCare<span className="text-blue-600">.</span>
            </span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
              Healthcare & EMR
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              pathname === '/' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
          >
            Home
          </Link>
          <Link
            href="/doctors"
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              pathname.startsWith('/doctors') ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
          >
            Find Doctors
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
          >
            Features
          </Link>
          <Link
            href="/#about"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
          >
            About Us
          </Link>
        </nav>

        {/* User Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link href={getDashboardLink()}>
                <Button variant="outline" className="flex items-center gap-2 border-slate-300">
                  <LayoutDashboard className="h-4 w-4 text-blue-600" />
                  <span>Dashboard</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold uppercase">
                    {user.role}
                  </Badge>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
                className="text-slate-600 hover:text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="ghost" className="font-medium text-slate-700 hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 font-medium shadow-md shadow-blue-600/20">
                  Book Appointment
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-blue-600 py-1"
          >
            Home
          </Link>
          <Link
            href="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-blue-600 py-1"
          >
            Find Doctors
          </Link>
          {isAuthenticated && user ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm font-medium text-blue-600 py-1"
              >
                <span>Go to Dashboard</span>
                <Badge variant="secondary">{user.role}</Badge>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left text-sm font-medium text-rose-600 py-1"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-blue-600">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
