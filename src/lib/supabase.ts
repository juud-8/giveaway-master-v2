import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      giveaways: {
        Row: {
          id: string;
          company_id: string;
          created_by: string;
          title: string;
          description: string | null;
          prize: string;
          prize_description: string | null;
          start_date: string;
          end_date: string;
          status: 'draft' | 'scheduled' | 'active' | 'ended' | 'winner_selected';
          winner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['giveaways']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['giveaways']['Insert']>;
      };
      giveaway_entries: {
        Row: {
          id: string;
          giveaway_id: string;
          user_email: string;
          user_id: string | null;
          user_name: string | null;
          entry_data: Record<string, any> | null;
          ip_address: string | null;
          entered_at: string;
        };
        Insert: Omit<Database['public']['Tables']['giveaway_entries']['Row'], 'id' | 'entered_at'>;
        Update: Partial<Database['public']['Tables']['giveaway_entries']['Insert']>;
      };
      giveaway_winners: {
        Row: {
          id: string;
          giveaway_id: string;
          entry_id: string;
          winner_email: string;
          winner_name: string | null;
          selected_at: string;
          notified: boolean;
          notified_at: string | null;
          claimed: boolean;
          claimed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['giveaway_winners']['Row'], 'id' | 'selected_at'>;
        Update: Partial<Database['public']['Tables']['giveaway_winners']['Insert']>;
      };
    };
  };
};
