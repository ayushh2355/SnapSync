import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700 dark:text-gray-300">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-white/70 dark:bg-[#161b22] border ${error ? 'border-red-500' : 'border-slate-200/80 dark:border-[#2d2f45]'} rounded-lg text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:focus:ring-violet-500/40 focus:border-fuchsia-400 dark:focus:border-violet-500 transition-colors backdrop-blur-sm ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
