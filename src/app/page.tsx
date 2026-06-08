'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, Tags, CalendarDays } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { NotificationBell } from '@/components/ui/NotificationBell';

const FEATURES = [
  {
    name: 'Role-Based Access',
    description: 'Set custom permissions for photographers, admins, and guests so private photos stay private.',
    icon: Shield,
    theme: 'text-indigo-600 bg-indigo-500/15 dark:text-indigo-400 dark:bg-indigo-500/20',
  },
  {
    name: 'AI Auto-Tagging',
    description: 'Stop tagging manually. Our system scans and categorizes your event batches automatically.',
    icon: Tags,
    theme: 'text-fuchsia-600 bg-fuchsia-500/15 dark:text-fuchsia-400 dark:bg-fuchsia-500/20',
  },
  {
    name: 'Event Organization',
    description: 'Manage multiple events, filter galleries, and search through thousands of photos instantly.',
    icon: CalendarDays,
    theme: 'text-emerald-600 bg-emerald-500/15 dark:text-emerald-400 dark:bg-emerald-500/20',
  },
];

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50 font-sans selection:bg-fuchsia-500/30 relative z-10">
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-8 py-6 border-b border-white/40 dark:border-[#2d2f45] bg-white/30 dark:bg-[#0b0e14]/80 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center font-bold text-lg text-white">
              S
            </div>
            <span className="font-semibold text-xl tracking-tight">SnapSync</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-[#9ca3af]">
            <Link href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">How it works</Link>
          </nav>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-slate-800 animate-pulse border-2 border-fuchsia-500/50" />
            ) : isAuthenticated ? (
              <>
                <NotificationBell />
                <ProfileDropdown />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-4 py-2 rounded-full hover:from-indigo-500 hover:to-fuchsia-500 transition-colors shadow-md">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-32 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-slate-900 dark:text-white">
            Manage your event photos without the headache.
          </h1>

          <p className="text-lg text-slate-600 dark:text-[#9ca3af] mb-10 max-w-2xl">
            A better way to organize, tag, and deliver photos to your clients. Built for event photographers and clubs.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-indigo-600 text-white font-medium text-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-medium text-lg hover:from-indigo-500 hover:to-fuchsia-500 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Get Started
                </Link>
                <Link
                  href="#features"
                  className="w-full sm:w-auto px-8 py-3 rounded-full glass-card dark:bg-[#1e293b] dark:border-[#2d2f45] text-slate-700 dark:text-white font-medium text-lg hover:bg-white/60 dark:hover:bg-[#252d3d] transition-colors"
                >
                  View Features
                </Link>
              </>
            )}
          </div>

          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl w-full text-left">
            {FEATURES.map((feature) => (
              <div
                key={feature.name}
                className="p-8 rounded-[1.75rem] glass-card dark:bg-[#1e293b] dark:border-[#2d2f45] hover:bg-white/55 dark:hover:bg-[#252d3d] transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.theme}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{feature.name}</h3>
                <p className="text-slate-600 dark:text-[#9ca3af] leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
