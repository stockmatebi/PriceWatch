import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ljnbmxzyalquefzvsyhm.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_gHks1pMmcgLE3ZyZ1rgF_Q_nvGkarsm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
