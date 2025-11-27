# Sleep Wake Log

A single-page Electron app for Windows that tracks irregular sleep patterns (DSPS / circadian disorders). Data is stored locally in the user's data directory as JSON and reloads automatically on startup.

## Features
- Start/stop a single active sleep session; prevents multiple overlapping active sessions and resumes active timers on restart.
- Manually add, edit, or delete sleep sessions with validation for time ranges.
- Month-based navigation with previous/next arrows and a compact daily barcode timeline (with noon marker) to highlight patterns.
- Immediate persistence on every change (create/update/delete) so closing the app never loses history.

## Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the Electron app:
   ```bash
   npm start
   ```

## Packaging
To build a distributable Windows app (produces an `.exe` inside `dist/SleepWakeLog-win32-x64`):
```bash
npm run package:win
```

You can pin the generated `.exe` or create a desktop shortcut to launch without opening your editor.
