CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pw_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  website_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pw_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pw_supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES pw_suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES pw_products(id) ON DELETE CASCADE,
  source_url text,
  source_type text NOT NULL DEFAULT 'website',
  external_reference text,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (supplier_id, product_id)
);

CREATE TABLE IF NOT EXISTS pw_price_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES pw_suppliers(id),
  product_id uuid NOT NULL REFERENCES pw_products(id),
  price numeric,
  promotion_text text,
  source_url text,
  source_type text,
  confidence text NOT NULL DEFAULT 'unverified',
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pw_price_snapshots_latest_idx ON pw_price_snapshots (checked_at DESC);
CREATE INDEX IF NOT EXISTS pw_price_snapshots_product_idx ON pw_price_snapshots (supplier_id, product_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS pw_manual_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES pw_suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES pw_products(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  dnu boolean NOT NULL DEFAULT false,
  UNIQUE (supplier_id, product_id)
);

CREATE TABLE IF NOT EXISTS pw_manual_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES pw_suppliers(id),
  product_id uuid NOT NULL REFERENCES pw_products(id),
  price numeric NOT NULL,
  notes text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  source_type text NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS pw_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES pw_suppliers(id) ON DELETE SET NULL,
  platform text NOT NULL,
  title text,
  text text,
  image_url text,
  post_url text,
  external_post_id text,
  posted_at timestamptz,
  detected_at timestamptz NOT NULL DEFAULT now(),
  ai_summary text,
  ai_extraction jsonb,
  is_promotion boolean NOT NULL DEFAULT true,
  confidence numeric,
  valid_from date,
  valid_until date,
  validity_type text,
  validity_text text,
  validity_confidence numeric
);
CREATE INDEX IF NOT EXISTS pw_promotions_detected_idx ON pw_promotions (detected_at DESC);

CREATE TABLE IF NOT EXISTS pw_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES pw_suppliers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES pw_products(id) ON DELETE SET NULL,
  promotion_id uuid REFERENCES pw_promotions(id) ON DELETE SET NULL,
  old_price numeric,
  new_price numeric,
  percentage_change numeric,
  source_url text,
  alert_type text NOT NULL DEFAULT 'price_change',
  detected_at timestamptz NOT NULL DEFAULT now(),
  notification_status text NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS pw_alerts_detected_idx ON pw_alerts (detected_at DESC);

CREATE TABLE IF NOT EXISTS pw_check_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  checked_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  results jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS pw_social_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES pw_suppliers(id) ON DELETE CASCADE,
  platform text NOT NULL,
  page_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_seen_external_id text,
  last_checked_at timestamptz,
  adapter text NOT NULL DEFAULT 'manual_or_public'
);

CREATE TABLE IF NOT EXISTS pw_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pw_monitor_config (
  id integer PRIMARY KEY,
  token_hash text NOT NULL,
  enabled boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS pw_ocr_usage (
  usage_date date PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION pw_record_manual_price_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.price IS NOT NULL AND OLD.price > 0 THEN
      INSERT INTO pw_manual_price_history (supplier_id, product_id, price, notes, source_type)
      VALUES (OLD.supplier_id, OLD.product_id, OLD.price, COALESCE(OLD.notes, 'Removed manual price'), 'removed');
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.price IS NOT NULL AND NEW.price > 0 AND (TG_OP = 'INSERT' OR OLD.price IS DISTINCT FROM NEW.price OR OLD.dnu IS DISTINCT FROM NEW.dnu) THEN
    INSERT INTO pw_manual_price_history (supplier_id, product_id, price, notes, source_type)
    VALUES (NEW.supplier_id, NEW.product_id, NEW.price, NEW.notes, CASE WHEN NEW.dnu THEN 'dnu' ELSE 'manual' END);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pw_manual_price_history_trigger ON pw_manual_prices;
CREATE TRIGGER pw_manual_price_history_trigger
AFTER INSERT OR UPDATE OR DELETE ON pw_manual_prices
FOR EACH ROW EXECUTE FUNCTION pw_record_manual_price_history();

CREATE OR REPLACE FUNCTION mark_pw_alerts_read(alert_ids uuid[])
RETURNS void LANGUAGE sql AS $$
  UPDATE pw_alerts SET notification_status = 'read' WHERE id = ANY(alert_ids);
$$;
