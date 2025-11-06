'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Loader, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Giveaway {
  id: string;
  title: string;
  prize: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function Dashboard() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const cid = params.get('companyId');
        
        if (!cid) {
          setError('No company ID found. Please access this app through Whop.');
          setLoading(false);
          return;
        }

        setCompanyId(cid);

        const { data, error: fetchError } = await supabase
          .from('giveaways')
          .select('*')
          .eq('company_id', cid)
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setGiveaways(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Giveaway Master</h1>
              <p className="text-slate-400 mt-1">Manage and track your giveaways</p>
            </div>
            {companyId && (
              <Link
                href={`/giveaways/create?companyId=${companyId}`}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Giveaway
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">Error</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {giveaways.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-3 bg-slate-800 rounded-lg mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">No giveaways yet</h2>
            <p className="text-slate-400 mb-6">Create your first giveaway to get started</p>
            {companyId && (
              <Link
                href={`/giveaways/create?companyId=${companyId}`}
                className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create Giveaway
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {giveaways.map((giveaway) => (
              <Link
                key={giveaway.id}
                href={`/giveaways/${giveaway.id}?companyId=${companyId}`}
                className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                      {giveaway.title}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Prize: {giveaway.prize}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      giveaway.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : giveaway.status === 'winner_selected'
                          ? 'bg-blue-500/20 text-blue-400'
                          : giveaway.status === 'scheduled'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {giveaway.status.charAt(0).toUpperCase() + giveaway.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Created {formatDistanceToNow(new Date(giveaway.created_at), { addSuffix: true })}</span>
                  <span className="text-slate-500">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
