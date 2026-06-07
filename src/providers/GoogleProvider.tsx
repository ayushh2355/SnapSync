'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

interface GoogleProviderProps {
  children: React.ReactNode;
  clientId: string;
}

export function GoogleProvider({ children, clientId }: GoogleProviderProps) {
  if (!clientId) {
    throw new Error('GoogleProvider requires a valid clientId');
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
