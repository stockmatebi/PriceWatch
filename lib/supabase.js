import {createClient} from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://iymwzyxlvtyidebxdzyw.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7_ms0zNP3-ZEX8tDJtyvWw_jqTMs0AP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
