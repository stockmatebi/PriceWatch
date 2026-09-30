import { createClient } from '@supabase/supabase-js';
const url='https://iymwzyxlvtyidebxdzyw.supabase.co';
const key='sb_publishable_7_ms0zNP3-ZEX8tDJtyvWw_jqTMs0AP';
export const supabase=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
