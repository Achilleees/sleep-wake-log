# Sleep Wake Log

A single-page Electron app for Windows that tracks irregular sleep and tiredness patterns (DSPS / circadian disorders). Data is stored locally in the user's data directory as JSON and reloads automatically on startup.

## Features
- Start/stop a single active sleep session; prevents multiple overlapping active sessions.
- Manually add, edit, or delete sleep sessions and tired periods with validation for time ranges.
- Session list filtered by date ranges (7/30/90 days, all time, or custom).
- "Barcode" timeline that splits sessions across calendar days to visualize shifting schedules.
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

The app runs as a single window SPA; all data is saved to `<userData>/sleepData.json` managed by Electron.
