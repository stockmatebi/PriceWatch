# PriceWatch self-hosted migration (staged)

This directory is the **first migration scaffold**, not yet a replacement build for the phone app. Keep the hosted Supabase project running until the app, monitoring workers, migration and remote connection have all been verified.

## Target layout

- PostgreSQL 16 in Docker, with a persistent named volume.
- Node.js/Express API with an API key, exposing only the app-facing endpoints.
- Tailscale on the Windows PC and phone for private remote access.
- Separate monitoring workers/scheduler, to be migrated and tested in a later stage.

## Windows setup (do not run until the migration data export is ready)

1. Install Docker Desktop and enable WSL 2/virtualization if prompted.
2. Copy `.env.example` to `.env`. Set a long random `PRICEWATCH_API_KEY` and a different strong `POSTGRES_PASSWORD`.
3. Ensure `DATABASE_URL` in `.env` uses the same password, e.g. `postgres://pricewatch:YOUR_PASSWORD@127.0.0.1:5432/pricewatch`.
4. From this folder run `docker compose up -d --build`.
5. Verify `http://127.0.0.1:8787/health` reports database connected.
6. Install Tailscale on the PC and phone, sign into the same tailnet, and test private connectivity. Do not configure router port-forwarding or expose PostgreSQL publicly.

## Migration stages

1. Provision local database/API (schema included).
2. Export source rows and import them while preserving UUIDs, foreign keys and timestamps.
3. Port and test monitoring logic from the existing `pw-monitor`, `pw-social-monitor-v2`, and `pw-ocr-reader` functions. No scraping worker is included in this initial scaffold.
4. Change the React Native app to use the new API, then build and test an APK against the private Tailscale address.
5. Verify supplier and product counts, latest prices, promotions, alerts, manual price history, and monitoring runs.
6. Configure Windows startup/Task Scheduler and recovery after the daily reboot.
7. Only then consider retiring Supabase.

## Security notes

- Never commit `.env`, live keys, or database passwords.
- The API binds to the container/host service, but Docker port publishing is bound to loopback. Remote phone access must be configured deliberately; do not expose the port directly to the public internet.
- The current app still uses Supabase until a separate tested app change is made.
- Price/social monitoring, OCR, push notifications, and scheduler parity are **not implemented by this scaffold yet**.
