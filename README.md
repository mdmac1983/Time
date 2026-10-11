# Time Hub

All-in-one time & planning app: **clock, alarms, stopwatches, countdown timers, a holiday calendar, to-do lists, a journal and save-the-dates** — with a custom-drawn icon set and 9 UI themes.

Runs as a native **Android app** (alarms and timers ring even when the app is closed) and as an installable, offline **web app** (PWA).

## Features

| Section | What it does |
| --- | --- |
| **Clock** | Analog + digital clock, "today at a glance" (next alarm, to-dos due, next birthday, next holiday), unlimited world clocks with day/night and offset |
| **Alarms** | Unlimited alarms, repeat on any weekdays, 6 built-in synthesized tones, adjustable snooze, one-time alarms auto-switch off |
| **Stopwatches** | Run several at once, each with laps (best/worst lap highlighted) |
| **Timers** | Run several countdowns at once, quick presets (incl. Pomodoro), +1 min, progress rings |
| **Calendar** | Month view with holidays, events, to-dos, journal entries and save-the-dates on one grid; day agenda; upcoming holidays |
| **To-do** | Multiple lists, due dates, priorities, filters (Today / Upcoming / Overdue / Done), quick add (`Call mom tomorrow`, `Pay rent!`) |
| **Journal** | Daily entries with mood, writing prompts, search, streak & word count |
| **Save the Date** | Birthdays, anniversaries, big days, memorials — countdowns, ages/milestones ("Turns 36", "12th anniversary"), reminders days ahead |
| **Themes** | Aurora, Daylight, Sunset, Forest, Ocean, Synthwave, Paper, Rosé, Midnight OLED |

### Holidays
Public holidays & observances for the **US, Canada, UK and Australia**, plus Christian (incl. Orthodox Easter), Jewish, Islamic, Lunar/cultural (Lunar New Year, Diwali, Holi, Mid-Autumn…), international days, equinoxes/solstices, full moons and your local daylight-saving changes. Everything is computed on-device for any year (Hebrew/Islamic/Chinese calendars via ICU; moon phases and seasons via Meeus' algorithms). Pick countries and categories in Settings.

All data stays on the device; Settings → Backup exports/imports a JSON file.

## Releases & versioning

Versions go up by **0.1** per update: 1.0 → 1.1 → 1.2 … → 1.9 → 2.0.

```bash
npm run bump      # bumps package.json, lockfile and service-worker cache
git commit -am "Release v1.1" && git push
```

Every push runs `.github/workflows/release.yml`: tests, web build, signed Android APK. If the version in `package.json` has no release yet, it publishes a GitHub Release `vX.Y` with `TimeHub-vX.Y.apk` (Android), `TimeHub-vX.Y.html` (the whole web app in one file — double-click to open) and `TimeHub-vX.Y-web.zip` (for hosting). Pushes to `main` also deploy the web app to GitHub Pages (enable once: Settings → Pages → Source: GitHub Actions). Android `versionCode` is `major*100 + minor` so each release installs over the previous one.

### Signing
Release APKs are signed with `android/app/timehub-release.jks` unless the repository has these secrets, in which case CI uses them instead:

- `TIMEHUB_KEYSTORE_BASE64` — base64 of your private `.jks`
- `TIMEHUB_KEYSTORE_PASSWORD`
- `TIMEHUB_KEY_ALIAS` (optional, default `timehub`)

The fallback keystore is public (this repo is public), so anyone could sign an APK that Android accepts as an update. Only install APKs from this repo's Releases page. Switching to a private key later requires uninstalling the app once (back up your data first in Settings → Backup).

## Development

```bash
npm install
npm run dev        # web dev server
npm test           # holiday engine tests
npm run build      # production web build -> dist/
npm run icons      # re-render PNG icons from public/icon.svg
npx cap sync android && (cd android && ./gradlew assembleRelease)
```

Stack: React 18 + TypeScript + Vite, Capacitor 7 (Android, local notifications).
