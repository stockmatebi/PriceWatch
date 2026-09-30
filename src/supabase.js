import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra=Constants.expoConfig?.extra??{};
const url=process.env.EXPO_PUBLIC_SUPABASE_URL||extra.supabaseUrl;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY||extra.supabasePublishableKey;
if(!url||!key) throw new Error('Supabase configuration is missing.');
export const supabase=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
