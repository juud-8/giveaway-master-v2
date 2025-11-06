'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';

export default function CreateGiveaway() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize: '',
    prize_description: '',
    start_date: '',
    end_date: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!companyId) {
        throw new Error('No company ID provided');
      }

      if (!formData.title || !formData.prize || !formData.start_date || !formData.end_date) {
        throw new Error('Please fill in all required fields');
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (startDate >= endDate) {
        throw new Error('End date must be after start date');
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || 'unknown';

      const { data, error: insertError } = await supabase
        .from('giveaways')
        .insert([
          {
            company_id: companyId,
            created_by: userId,
            title: formData.title,
            description: formData.description || null,
            prize: formData.prize,
            prize_description: formData.prize_description || null,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: startDate > new Date() ? 'scheduled' : 'active',
          },
        ])
        .select();

      if (insertError) {
        throw insertError;
      }

      router.push(`/?companyId=${companyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create giveaway');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href={`/?companyId=${companyId}`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Giveaway</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">Giveaway Details</h2>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-200 mb-2">
                Giveaway Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g., Win a Free 3-Month Membership"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Tell participants what this giveaway is about..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prize" className="block text-sm font-medium text-slate-200 mb-2">
                  Prize *
                </label>
                <input
                  id="prize"
                  name="prize"
                  type="text"
                  placeholder="e.g., 3-Month Membership"
                  value={formData.prize}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="prize_description" className="block text-sm font-medium text-slate-200 mb-2">
                  Prize Details
                </label>
                <input
                  id="prize_description"
                  name="prize_description"
                  type="text"
                  placeholder="e.g., Worth $100"
                  value={formData.prize_description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">Giveaway Timing</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-slate-200 mb-2">
                  Start Date & Time *
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-slate-200 mb-2">
                  End Date & Time *
                </label>
                <input
                  id="end_date"
                  name="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Giveaway'}
            </button>
            <Link
              href={`/?companyId=${companyId}`}
              className="px-6 py-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
