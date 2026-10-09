import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
const apiKey = process.env.PRICEWATCH_API_KEY;

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
if (!apiKey || apiKey.length < 32) throw new Error('Set PRICEWATCH_API_KEY to a random secret of at least 32 characters.');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 30000 });
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
const origins = String(process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin(origin, callback) {
  if (!origin || origins.length === 0 || origins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin not allowed by CORS'));
}}));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'pricewatch-local-api', database: 'connected' });
  } catch {
    res.status(503).json({ ok: false, service: 'pricewatch-local-api', database: 'unavailable' });
  }
});

app.use('/api', (req, res, next) => {
  const supplied = req.get('x-pricewatch-key') || '';
  if (supplied.length !== apiKey.length || !timingSafeEqual(supplied, apiKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

function timingSafeEqual(a, b) {
  // Constant-time comparison for equal-length UTF-8 strings.
  const { timingSafeEqual: compare } = awaitlessCrypto;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && compare(aa, bb);
}
import { timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';
const awaitlessCrypto = { timingSafeEqual: cryptoTimingSafeEqual };

async function rows(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}
async function safe(res, work) {
  try { return res.json(await work()); }
  catch (error) {
    console.error('API request failed:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

app.get('/api/bootstrap', (_req, res) => safe(res, async () => {
  const [suppliers, products, snapshots, manualPrices, manualHistory, promotions, alerts, runs] = await Promise.all([
    rows("SELECT id,name,location,website_url FROM pw_suppliers WHERE active = true ORDER BY name"),
    rows("SELECT id,name,category,unit FROM pw_products WHERE active = true ORDER BY name"),
    rows("SELECT id,supplier_id,product_id,price,promotion_text,source_url,source_type,confidence,checked_at FROM pw_price_snapshots ORDER BY checked_at DESC LIMIT 500"),
    rows("SELECT id,supplier_id,product_id,price,notes,dnu,updated_at FROM pw_manual_prices ORDER BY updated_at DESC"),
    rows("SELECT id,supplier_id,product_id,price,notes,recorded_at,source_type FROM pw_manual_price_history ORDER BY recorded_at DESC LIMIT 500"),
    rows("SELECT id,supplier_id,platform,title,text,image_url,post_url,posted_at,detected_at,ai_summary,ai_extraction,is_promotion,confidence,valid_from,valid_until,validity_type,validity_text,validity_confidence FROM pw_promotions WHERE is_promotion = true ORDER BY detected_at DESC LIMIT 50"),
    rows("SELECT id,supplier_id,product_id,old_price,new_price,percentage_change,source_url,alert_type,detected_at,notification_status FROM pw_alerts WHERE alert_type IN ('price_change','promotion_price_change') ORDER BY detected_at DESC LIMIT 30"),
    rows("SELECT id,started_at,finished_at,status,checked_count,updated_count,error_count,results FROM pw_check_runs ORDER BY started_at DESC LIMIT 1")
  ]);
  return { suppliers, products, snapshots, manualPrices, manualHistory, promotions, alerts, latestRun: runs[0] || null };
}));

app.post('/api/alerts/read', (req, res) => safe(res, async () => {
  const ids = req.body?.alertIds;
  if (!Array.isArray(ids) || ids.length > 500 || ids.some(id => typeof id !== 'string')) {
    return res.status(400).json({ error: 'Invalid alertIds' });
  }
  await pool.query("UPDATE pw_alerts SET notification_status = 'read' WHERE id = ANY($1::uuid[])", [ids]);
  return { ok: true, updated: ids.length };
}));

app.post('/api/manual-prices', (req, res) => safe(res, async () => {
  const { supplier_id, product_id, price, notes, dnu = false } = req.body || {};
  const numericPrice = Number(price);
  if (!supplier_id || !product_id || !Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'Invalid manual price payload' });
  }
  const result = await pool.query(
    `INSERT INTO pw_manual_prices (supplier_id, product_id, price, notes, dnu, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, now())
     ON CONFLICT (supplier_id, product_id) DO UPDATE SET price = EXCLUDED.price, notes = EXCLUDED.notes, dnu = EXCLUDED.dnu, updated_at = now()
     RETURNING id,supplier_id,product_id,price,notes,dnu,updated_at`,
    [supplier_id, product_id, Number(numericPrice.toFixed(2)), notes || null, Boolean(dnu)]
  );
  return result.rows[0];
}));

app.delete('/api/manual-prices', (req, res) => safe(res, async () => {
  const { supplier_id, product_id } = req.body || {};
  if (!supplier_id || !product_id) return res.status(400).json({ error: 'supplier_id and product_id are required' });
  await pool.query('DELETE FROM pw_manual_prices WHERE supplier_id = $1::uuid AND product_id = $2::uuid', [supplier_id, product_id]);
  return { ok: true };
}));

app.use((error, _req, res, _next) => {
  if (error?.message === 'Origin not allowed by CORS') return res.status(403).json({ error: 'Origin not allowed' });
  console.error('Unhandled request error:', error.message);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, host, () => console.log(`PriceWatch API listening on ${host}:${port}`));
async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
