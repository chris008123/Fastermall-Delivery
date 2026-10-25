# Bringing the delivery map back

The live map is switched off, so `react-native-maps` is not installed. That keeps its native code out of every build (a noticeable saving in app size).

`DeliveryMap.reference.tsx.txt` is the last working version of the map component. It is saved with a `.txt` ending so it is not compiled.

To restore it:

1. Install the package: `npx expo install react-native-maps`
2. Copy `DeliveryMap.reference.tsx.txt` to `src/shared/components/DeliveryMap.tsx`.
3. Add a Google Maps API key for Android (and iOS if you use Google there) in `app.json`: `android.config.googleMaps.apiKey`. Restrict the key to the app's package name and signing certificate in the Google Cloud console.
4. In `app/(partner)/active/[id].tsx` and `app/(partner)/jobs/[id].tsx`, import `DeliveryMap` and uncomment the lines that render it (each has a note).
5. Make a new build. A map change needs a native build, not just a reload.

Partner position on the map comes from `getPartnerPosition` in `src/utils/geo.ts`, which is an estimate from the job stage. Real positions need the partner-location work in `BACKEND_CHANGES_NEEDED.md` (item 19).
