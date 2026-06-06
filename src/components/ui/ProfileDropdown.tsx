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
        className="w-10 h-10 rounded-full border-2 border-indigo-500/50 flex items-center justify-center font-bold text-yellow-500 hover:border-yellow-500 transition-colors bg-slate-800"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#0f172a] border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white truncate max-w-[150px]">{user.name}</span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {user.role}
              </span>
            </div>
            <div className="text-sm text-gray-400 truncate">{user.email}</div>
          </div>
          
          <div className="p-2">
            <Link 
              href="/profile" 
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <Link 
              href="/dashboard" 
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <button 
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-500 font-medium hover:bg-gray-800 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
