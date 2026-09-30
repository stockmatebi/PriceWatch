import { supabase } from './supabase';

export async function getDashboardData(){
 const [{data:suppliers,error:a},{data:products,error:b},{data:snapshots,error:c},{data:promotions,error:d},{data:checkRuns,error:e}]=await Promise.all([
  supabase.from('pw_suppliers').select('*').eq('active',true).order('name'),
  supabase.from('pw_products').select('*').eq('active',true).order('name'),
  supabase.from('pw_price_snapshots').select('*').order('checked_at',{ascending:false}).limit(300),
  supabase.from('pw_promotions').select('*, pw_suppliers(name)').eq('is_promotion',true).order('detected_at',{ascending:false}).limit(20),
  supabase.from('pw_check_runs').select('*').order('started_at',{ascending:false}).limit(10)
 ]);
 const error=a||b||c||d||e;if(error)throw error;
 return{suppliers:suppliers||[],products:products||[],snapshots:snapshots||[],promotions:promotions||[],checkRuns:checkRuns||[]};
}
export function buildLatestPrices(suppliers,products,snapshots){
 const sm=Object.fromEntries(suppliers.map(x=>[x.id,x])),pm=Object.fromEntries(products.map(x=>[x.id,x])),groups=new Map();
 for(const r of snapshots){if(!sm[r.supplier_id]||!pm[r.product_id])continue;const k=r.supplier_id+':'+r.product_id,old=groups.get(k);if(!old||new Date(r.checked_at)>new Date(old.checked_at))groups.set(k,r);}
 return [...groups.values()].map(r=>({...r,supplier:sm[r.supplier_id],product:pm[r.product_id]}));
}
export function getPreviousPrice(snapshots,supplierId,productId,checkedAt){
 return snapshots.filter(r=>r.supplier_id===supplierId&&r.product_id===productId&&new Date(r.checked_at)<new Date(checkedAt)).sort((a,b)=>new Date(b.checked_at)-new Date(a.checked_at))[0]?.price??null;
}
export function calculateChange(current,previous){if(current==null||previous==null||Number(previous)===0)return null;return((Number(current)-Number(previous))/Number(previous))*100;}
export async function registerPushToken(token,platform){const{error}=await supabase.from('pw_push_tokens').upsert({token,platform,last_seen_at:new Date().toISOString()},{onConflict:'token'});if(error)throw error;}
