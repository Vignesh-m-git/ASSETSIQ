import { createClient } from '@supabase/supabase-js';

// NOTE: In a real environment, these are populated via .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Key is missing! Check your .env.local file.');
}

// Fallback to prevent app crash if keys are missing
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');

export const checkSession = async () => {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};