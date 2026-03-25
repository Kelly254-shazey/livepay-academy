# LiveGate Mobile Release Notes

This app is structured for Expo EAS builds and can be prepared for Google Play and the Apple App Store.

## Release config added

- `app.json` now declares:
  - Android package: `com.livegate.mobile`
  - iOS bundle identifier: `com.livegate.mobile`
  - Android `versionCode`
  - iOS `buildNumber`
  - camera and microphone permission text
  - `expo-camera` plugin configuration
- `eas.json` now declares:
  - `development`
  - `preview`
  - `production`
  - submit profile for Android internal track

## Still required before store submission

1. Set a real production API URL in `.env` or EAS secrets.
2. Create store listing assets:
   - screenshots
   - short description
   - full description
   - privacy policy URL
   - support email
3. Test on physical Android and iPhone devices.
4. Review demo data and remove or gate anything that should not ship to production.
5. Build signed release artifacts with EAS:

```bash
eas build -p android --profile production
eas build -p ios --profile production
```

6. Submit builds:

```bash
eas submit -p android --profile production
eas submit -p ios --profile production
```

## Production environment

Do not ship with:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

Replace it with the public production API base URL that devices can reach.
