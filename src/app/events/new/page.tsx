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
        className="text-slate-500 hover:text-slate-900 font-medium text-sm mb-8 transition-colors self-start"
      >
        &larr; Back to Dashboard
      </button>

      <div className="w-full rounded-[28px] border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/10 via-fuchsia-500/5 to-transparent backdrop-blur-md shadow-[0_30px_80px_rgba(217,70,239,0.15)] p-8 transition-all duration-500 hover:shadow-[0_0_100px_rgba(217,70,239,0.4)] hover:border-fuchsia-500/60 bg-white/40">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Create New Event</h1>
        <p className="text-gray-600 mb-8">Set up a new event to start organizing your media.</p>

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
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                className="w-full px-3 py-2 bg-white/70 border border-slate-200/80 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400 transition-colors backdrop-blur-sm appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="" disabled hidden>Select a category</option>
                <option value="Photography">Photography</option>
                <option value="Workshop">Workshop</option>
                <option value="Competition">Competition</option>
                <option value="Concert">Concert</option>
                <option value="Cultural Fest">Cultural Fest</option>
                <option value="Party">Party</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              className="w-full bg-white/70 border border-slate-200/80 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400 transition-colors min-h-[120px] resize-y backdrop-blur-sm shadow-[0_10px_30px_rgba(217,70,239,0.05)]"
              placeholder="Provide some details about this event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-4 bg-white/50 border border-fuchsia-400/20 rounded-xl cursor-pointer hover:bg-white/70 hover:border-fuchsia-400/40 transition-colors shadow-sm backdrop-blur-sm">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500 bg-white cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">Private Event</span>
                <span className="text-xs text-gray-600">Only authorized club members can view media</span>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isSubmitting} className="w-full md:w-auto px-8 rounded-xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-600/80 via-purple-600/80 to-fuchsia-600/80 text-white shadow-[0_15px_35px_rgba(217,70,239,0.3)] backdrop-blur-sm transition duration-200 hover:border-fuchsia-300/40 hover:from-fuchsia-500/90 hover:via-purple-500/90 hover:to-fuchsia-500/90">
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
