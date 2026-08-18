'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/store/authStore';
import { authApi } from '@/services/auth.service';
import { notificationApi } from '@/services/index';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  FileText,
  Clock,
  Users,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Stethoscope,
  CreditCard
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const patientNavItems: NavItem[] = [
  { title: 'Overview', href: '/patient', icon: LayoutDashboard },
  { title: 'Find Doctors', href: '/doctors', icon: Stethoscope },
  { title: 'My Appointments', href: '/patient/appointments', icon: Calendar },
  { title: 'Medical Records', href: '/patient/records', icon: FileText },
  { title: 'Notifications', href: '/patient/notifications', icon: Bell },
];

const doctorNavItems: NavItem[] = [
  { title: 'Doctor Dashboard', href: '/doctor', icon: LayoutDashboard },
  { title: 'Patient Appointments', href: '/doctor/appointments', icon: Calendar },
  { title: 'Weekly Availability', href: '/doctor/availability', icon: Clock },
  { title: 'Notifications', href: '/doctor/notifications', icon: Bell },
];

const adminNavItems: NavItem[] = [
  { title: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'Doctor Approvals', href: '/admin/doctors', icon: ShieldCheck },
  { title: 'User Management', href: '/admin/users', icon: Users },
];

export default function DashboardLayout({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: UserRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check if user is logged in
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Role-based protection check
    if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
      if (user.role === 'DOCTOR') router.push('/doctor');
      else if (user.role === 'PATIENT') router.push('/patient');
      else router.push('/admin');
    }

    // Fetch unread notifications count
    notificationApi.getNotifications(1)
      .then((res: any) => {
        if (res?.unreadCount) setUnreadCount(res.unreadCount);
      })
      .catch(() => {});
  }, [isAuthenticated, user, requiredRole, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const navItems =
    user.role === 'DOCTOR'
      ? doctorNavItems
      : user.role === 'ADMIN'
      ? adminNavItems
      : patientNavItems;

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white p-5 justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                PulseCare<span className="text-blue-600">.</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {user.role} Portal
              </span>
            </div>
          </Link>

          {/* Nav List */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.title}</span>
                  </div>
                  {item.title === 'Notifications' && unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 bg-blue-100 text-blue-700">
              {getInitials(user.name)}
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-slate-900 truncate">{user.name}</span>
              <span className="text-xs text-slate-400 truncate">{user.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Log out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <HeartPulse className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900">PulseCare</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Sidebar Modal */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex flex-col w-72 bg-white p-5 justify-between h-full shadow-2xl z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-slate-900">PulseCare {user.role}</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                          isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </Button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
