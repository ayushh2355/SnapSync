'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

export const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-full border-[2px] border-fuchsia-600 flex items-center justify-center font-bold text-lg text-fuchsia-600 hover:bg-fuchsia-50 transition-colors bg-white shadow-sm"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-[28px] border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/10 via-fuchsia-500/5 to-transparent backdrop-blur-xl shadow-[0_30px_80px_rgba(217,70,239,0.15)] bg-white/40 overflow-hidden z-[100]">
          <div className="p-5 border-b border-fuchsia-400/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-slate-900 text-lg truncate max-w-[140px]">{user.name}</span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-fuchsia-100/80 text-fuchsia-600 border border-fuchsia-300/50">
                {user.role}
              </span>
            </div>
            <div className="text-sm text-slate-600 truncate">{user.email}</div>
          </div>
          
          <div className="p-3">
            <Link 
              href="/profile" 
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <Link 
              href="/dashboard" 
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors mb-2"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <button 
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-500 font-medium hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
