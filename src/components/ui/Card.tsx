import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden ${onClick ? 'cursor-pointer hover:border-gray-700 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
