# Price Watch

Standalone competitor price and promotion tracker.

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

## Stack
Expo SDK 57 / React Native 0.86, Supabase, Expo Notifications and EAS Build.

The app reads the isolated pw_* tables in the existing Supabase project. Price collection, social monitoring and AI/OCR processing are server-side responsibilities; no OpenAI secret belongs in the mobile app.

## APK
The EAS preview profile is configured to produce a directly installable Android APK. Before the first non-interactive build, replace the placeholder EAS project ID in app.json and provide an Expo/EAS token to the build environment.
