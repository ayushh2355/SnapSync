import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading, className = '', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white hover:from-fuchsia-500 hover:to-blue-500 focus:ring-fuchsia-500 shadow-md dark:bg-violet-600 dark:hover:bg-violet-500 dark:from-violet-600 dark:to-violet-600 dark:hover:from-violet-500 dark:hover:to-violet-500 dark:focus:ring-violet-500 dark:shadow-none',
    secondary: 'bg-slate-200 dark:bg-[#161b22] text-slate-800 dark:text-gray-200 hover:bg-slate-300 dark:hover:bg-[#1e293b] focus:ring-slate-400 dark:focus:ring-violet-500 dark:border dark:border-[#2d2f45]',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161b22] focus:ring-slate-300 dark:focus:ring-violet-500',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
