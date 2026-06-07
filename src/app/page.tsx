'use client';

import Link from 'next/link';
import { Shield, Tags, CalendarDays } from 'lucide-react';

const FEATURES = [
  {
    name: 'Role-Based Access',
    description: 'Set custom permissions for photographers, admins, and guests so private photos stay private.',
    icon: Shield,
    theme: 'text-indigo-400 bg-indigo-500/20',
  },
  {
    name: 'AI Auto-Tagging',
    description: 'Stop tagging manually. Our system scans and categorizes your event batches automatically.',
    icon: Tags,
    theme: 'text-fuchsia-400 bg-fuchsia-500/20',
  },
  {
    name: 'Event Organization',
    description: 'Manage multiple events, filter galleries, and search through thousands of photos instantly.',
    icon: CalendarDays,
    theme: 'text-emerald-400 bg-emerald-500/20',
  },
];

import { useAuth } from '@/providers/AuthProvider';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { NotificationBell } from '@/components/ui/NotificationBell';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-1/2 h-1/2 rounded-full bg-indigo-600/20 blur-3xl opacity-50" />
        <div className="absolute bottom-[-20%] right-[-10%] w-1/2 h-1/2 rounded-full bg-fuchsia-600/20 blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center font-bold text-lg">
              S
            </div>
            <span className="font-semibold text-xl tracking-tight">SnapSync</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse border-2 border-indigo-500/50"></div>
            ) : isAuthenticated ? (
              <>
                <NotificationBell />
                <ProfileDropdown />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="text-sm font-medium bg-white text-slate-950 px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-32 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
            Manage your event photos without the headache.
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 max-w-2xl">
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
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-indigo-600 text-white font-medium text-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                >
                 Get Started
                </Link>
                <Link 
                  href="#demo" 
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 transition-colors"
                >
                  View Demo
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl w-full text-left">
            {FEATURES.map((feature) => (
              <div 
                key={feature.name} 
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.theme}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
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