# Time Hub — notes for Claude

- **Every update is a release, bumped by 0.1**: run `npm run bump` (1.0 → 1.1 … 1.9 → 2.0) in the same change, then push. CI (`.github/workflows/release.yml`) publishes GitHub Release `vX.Y` with the signed APK + web zip when the tag doesn't exist yet.
- Before pushing: `npx tsc -b && npm test && npm run build`. Tests pin `TZ=America/New_York`.
- Icons: hand-drawn duotone SVGs in `src/icons.tsx` (stroke = currentColor, `.ia`/`.ia-solid` = theme accent fills). Don't swap in generic icon libraries.
- Themes are CSS variable sets in `src/styles.css` keyed by `[data-theme]`, listed in `src/themes.ts`.
- App icon source is `public/icon.svg`; `npm run icons` regenerates PWA + Android PNGs.
- Persistent state: `usePersistent` (localStorage, `timehub:` prefix). Add new keys to `STORE_KEYS` so backups include them.
- Native alarms/timers/reminders are mirrored to Android via `syncNativeSchedule` in `src/lib/notify.ts`.
