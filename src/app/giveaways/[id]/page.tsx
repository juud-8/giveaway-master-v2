'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, Loader, Trash2, Trophy, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prize_description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  winner_id: string | null;
  created_at: string;
}

interface Entry {
  id: string;
  user_email: string;
  user_name: string | null;
  entered_at: string;
}

interface Winner {
  id: string;
  winner_email: string;
  winner_name: string | null;
  selected_at: string;
}

function GiveawayDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const giveawayId = params.id as string;
  const companyId = searchParams.get('companyId');

  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingWinner, setSelectingWinner] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntryEmail, setNewEntryEmail] = useState('');
  const [newEntryName, setNewEntryName] = useState('');
  const [addingEntry, setAddingEntry] = useState(false);

  useEffect(() => {
    const loadGiveaway = async () => {
      try {
        const { data: giveawayData, error: giveawayError } = await supabase
          .from('giveaways')
          .select('*')
          .eq('id', giveawayId)
          .single();

        if (giveawayError) throw giveawayError;
        setGiveaway(giveawayData);

        const { data: entriesData, error: entriesError } = await supabase
          .from('giveaway_entries')
          .select('*')
          .eq('giveaway_id', giveawayId)
          .order('entered_at', { ascending: false });

        if (entriesError) throw entriesError;
        setEntries(entriesData || []);

        if (giveawayData.winner_id) {
          const { data: winnerData, error: winnerError } = await supabase
            .from('giveaway_winners')
            .select('*')
            .eq('giveaway_id', giveawayId)
            .single();

          if (!winnerError && winnerData) {
            setWinner(winnerData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load giveaway');
      } finally {
        setLoading(false);
      }
    };

    loadGiveaway();
  }, [giveawayId]);

  const handleSelectWinner = async () => {
    if (!giveaway || entries.length === 0) return;

    setSelectingWinner(true);
    setError(null);

    try {
      const randomIndex = Math.floor(Math.random() * entries.length);
      const selectedEntry = entries[randomIndex];

      const { data: winnerData, error: winnerError } = await supabase
        .from('giveaway_winners')
        .insert([
          {
            giveaway_id: giveawayId,
            entry_id: selectedEntry.id,
            winner_email: selectedEntry.user_email,
            winner_name: selectedEntry.user_name,
          },
        ])
        .select()
        .single();

      if (winnerError) throw winnerError;

      const { error: updateError } = await supabase
        .from('giveaways')
        .update({
          status: 'winner_selected',
          winner_id: selectedEntry.id,
        })
        .eq('id', giveawayId);

      if (updateError) throw updateError;

      setWinner(winnerData);
      setGiveaway((prev) =>
        prev ? { ...prev, status: 'winner_selected', winner_id: selectedEntry.id } : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select winner');
    } finally {
      setSelectingWinner(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setDeletingEntry(entryId);

    try {
      const { error } = await supabase
        .from('giveaway_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setDeletingEntry(null);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEntry(true);
    setError(null);

    try {
      if (!newEntryEmail) {
        throw new Error('Email is required');
      }

      const existingEntry = entries.find((e) => e.user_email === newEntryEmail);
      if (existingEntry) {
        throw new Error('This email has already entered');
      }

      const { data: newEntry, error: insertError } = await supabase
        .from('giveaway_entries')
        .insert([
          {
            giveaway_id: giveawayId,
            user_email: newEntryEmail,
            user_name: newEntryName || null,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setEntries((prev) => [newEntry, ...prev]);
      setNewEntryEmail('');
      setNewEntryName('');
      setShowAddEntry(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setAddingEntry(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading giveaway...</p>
        </div>
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Giveaway not found</p>
          <Link href={`/?companyId=${companyId}`} className="text-primary hover:underline mt-2 block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link
            href={`/?companyId=${companyId}`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{giveaway.title}</h1>
              <p className="text-slate-400 mt-1">Prize: {giveaway.prize}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-1">Total Entries</p>
            <p className="text-3xl font-bold text-white">{entries.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-1">Starts</p>
            <p className="text-lg font-semibold text-white">
              {format(new Date(giveaway.start_date), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-1">Ends</p>
            <p className="text-lg font-semibold text-white">
              {format(new Date(giveaway.end_date), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>

        {winner ? (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Trophy className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Winner Selected!</h3>
                <p className="text-blue-200 mb-1">
                  <strong>{winner.winner_name || 'Participant'}</strong>
                </p>
                <p className="text-blue-200 mb-3">
                  Email: <code className="bg-blue-500/20 px-2 py-1 rounded">{winner.winner_email}</code>
                </p>
                <p className="text-blue-300 text-sm">
                  Selected {formatDistanceToNow(new Date(winner.selected_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ) : entries.length > 0 && giveaway.status !== 'winner_selected' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select a Winner</h3>
            <button
              onClick={handleSelectWinner}
              disabled={selectingWinner}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {selectingWinner && <Loader className="w-4 h-4 animate-spin" />}
              Pick Random Winner
            </button>
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Participants ({entries.length})</h2>
            <button
              onClick={() => setShowAddEntry(!showAddEntry)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>

          {showAddEntry && (
            <form onSubmit={handleAddEntry} className="mb-6 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Email *</label>
                <input
                  type="email"
                  value={newEntryEmail}
                  onChange={(e) => setNewEntryEmail(e.target.value)}
                  placeholder="participant@example.com"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Name</label>
                <input
                  type="text"
                  value={newEntryName}
                  onChange={(e) => setNewEntryName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingEntry}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg"
                >
                  {addingEntry && <Loader className="w-4 h-4 animate-spin" />}
                  Add Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEntry(false)}
                  className="text-slate-400 hover:text-white px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No entries yet</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div>
                    <p className="text-white font-medium">{entry.user_name || entry.user_email}</p>
                    <p className="text-slate-400 text-sm">{entry.user_email}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Entered {formatDistanceToNow(new Date(entry.entered_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    disabled={deletingEntry === entry.id}
                    className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GiveawayDetail() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <GiveawayDetailContent />
    </Suspense>
  );
}
