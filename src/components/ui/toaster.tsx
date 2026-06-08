'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { XCircle, CheckCircle2, X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-max flex-col-reverse items-center gap-3">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className="pointer-events-auto flex items-center gap-3 bg-[#0B0E14] border border-white/10 rounded-2xl px-5 py-3.5 shadow-2xl transition-all min-w-[280px] max-w-md animate-in slide-in-from-bottom-5"
        >
          {t.variant === 'destructive' ? (
            <XCircle size={18} className="text-red-500 fill-red-500/10 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-green-500 fill-green-500/10 shrink-0" />
          )}
          
          <div className="flex-1 flex flex-col justify-center">
            {t.title && !t.description && (
              <span className="text-sm font-medium text-white leading-none">{t.title}</span>
            )}
            {t.description && (
              <span className="text-sm font-medium text-slate-300 leading-tight">
                {t.title && t.variant !== 'destructive' && <span className="font-semibold text-white mr-2">{t.title}:</span>}
                {t.description}
              </span>
            )}
          </div>

          <button 
            onClick={() => dismiss(t.id)}
            className="text-slate-500 hover:text-white transition-colors ml-2 shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
