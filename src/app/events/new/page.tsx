'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient('/api/events', {
        method: 'POST',
        body: JSON.stringify({ name, date, category, description, isPrivate }),
      });

      toast({
        title: 'Event Created',
        description: `${name} has been successfully created.`,
      });
      
      router.push('/dashboard');
    } catch (err: unknown) {
      toast({
        title: 'Failed to create event',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto flex flex-col justify-center">
      <button 
        onClick={() => router.push('/dashboard')} 
        className="text-gray-400 hover:text-white text-sm mb-8 transition-colors self-start"
      >
        &larr; Back to Dashboard
      </button>

      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Event</h1>
        <p className="text-gray-400 mb-8">Set up a new event to start organizing your media.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Event Name" 
            placeholder="e.g. Tech Conference 2026" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Event Date" 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            
            <Input 
              label="Category" 
              placeholder="e.g. Conference, Wedding, Party" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-200">
              Description
            </label>
            <textarea
              className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-h-[120px] resize-y"
              placeholder="Provide some details about this event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-800/50 transition-colors">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Private Event</span>
                <span className="text-xs text-gray-400">Only authorized club members can view media</span>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isSubmitting} className="w-full md:w-auto px-8">
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
