import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;
if (!supabaseUrl || !serviceKey || !databaseUrl) {
  throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL in self-hosted/.env. Never commit this file.');
}

const tables = [
  'pw_suppliers',
  'pw_products',
  'pw_supplier_products',
  'pw_price_snapshots',
  'pw_manual_price_history',
  'pw_promotions',
  'pw_alerts',
  'pw_manual_prices',
  'pw_check_runs',
  'pw_social_sources',
  'pw_push_tokens',
  'pw_ocr_usage'
];
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

async function readTable(table) {
  const all = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
    url.searchParams.set('select', '*');
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));
    const response = await fetch(url, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/json'
      }
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Supabase export failed for ${table} (HTTP ${response.status}): ${detail}`);
    }
    const rows = await response.json();
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

function quoteIdentifier(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

async function importTable(client, table, rows) {
  if (!rows.length) {
    console.log(`${table}: 0 rows`);
    return 0;
  }
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const colSql = columns.map(quoteIdentifier).join(', ');
  const chunkSize = 100;
  let inserted = 0;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const values = [];
    const tuples = chunk.map((row, rowIndex) => {
      const marks = columns.map((column, colIndex) => {
        values.push(row[column] === undefined ? null : row[column]);
        return `$${rowIndex * columns.length + colIndex + 1}`;
      });
      return '(' + marks.join(', ') + ')';
    });
    const sql = `INSERT INTO ${quoteIdentifier(table)} (${colSql}) VALUES ${tuples.join(', ')} ON CONFLICT DO NOTHING`;
    const result = await client.query(sql, values);
    inserted += result.rowCount;
  }
  console.log(`${table}: source ${rows.length} rows; inserted ${inserted} new rows`);
  return inserted;
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('Reading source rows first; destination must be the new local database.');
    const exported = {};
    for (const table of tables) exported[table] = await readTable(table);
    await client.query('BEGIN');
    await client.query('ALTER TABLE pw_manual_prices DISABLE TRIGGER pw_manual_price_history_trigger');
    for (const table of tables) await importTable(client, table, exported[table]);
    await client.query('ALTER TABLE pw_manual_prices ENABLE TRIGGER pw_manual_price_history_trigger');
    await client.query('COMMIT');
    console.log('Data copy completed. Verify counts and sample records before changing the app.');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
