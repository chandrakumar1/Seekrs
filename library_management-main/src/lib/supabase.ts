import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  role: 'teacher' | 'student';
  created_at: string;
};

export type Book = {
  id: number;
  title: string;
  author: string;
  edition: string;
  category: string;
  total_copies: number;
  borrowed_copies: number;
  year_published: number;
  created_at: string;
  updated_at: string;
};

export type Student = {
  id: number;
  user_id: string | null;
  name: string;
  branch: 'CS' | 'IT' | 'ECE' | 'EEE' | 'MECH' | 'CIVIL';
  section: number;
  currently_borrowing: 'YES' | 'NO';
  borrowed_book_id: number | null;
  borrowed_book_name: string | null;
  borrowed_date: string | null;
  phone: string;
  days_borrowed: number;
  created_at: string;
  updated_at: string;
};
