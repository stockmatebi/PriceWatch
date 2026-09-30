# Price Watch

Standalone competitor price and promotion tracker for local building-material suppliers.

## Suppliers
- Cashbuild Howick
- Midmar Building Supplies
- Timber Solutions
- Midmar Tile & Hardware
- Midlands Mica Howick

## Products
- NPC Original Blue 50 kg
- NPC Original Black 50 kg
- Double Roman Roof Tile

## Architecture
- React Native + Expo native modules
- Android native project generated with Expo Prebuild
- Release APK built directly on GitHub Actions with Gradle
- Supabase for authentication and Price Watch data
- Supabase Edge Function for server-side price monitoring
- Supabase Cron for six daily monitoring runs at 08:00, 10:00, 12:00, 14:00, 16:00 and 18:00 South Africa time

**No EAS cloud build is required for the Android APK.**

## Monitoring
The server-side monitor is designed so supplier/source failures do not stop other suppliers from being checked. Prices are recorded only when a source produces a recognizable currency value; failed or unverified reads are not treated as prices.

Social-media monitoring uses source adapters and original-post URLs where public access is available. The app must never put private API keys or AI provider secrets into the APK.
