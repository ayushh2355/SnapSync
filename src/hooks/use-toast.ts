'use client';

import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let memoryState: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

function dispatch() {
  listeners.forEach((listener) => listener(memoryState));
}

export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, title, description, variant };
  
  memoryState = [...memoryState, newToast];
  dispatch();

  setTimeout(() => {
    memoryState = memoryState.filter((t) => t.id !== id);
    dispatch();
  }, 5000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return { toasts, toast };
}
