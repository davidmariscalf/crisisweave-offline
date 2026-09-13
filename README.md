# crisisweave-offline

Offline-resilience utilities for CrisisWeave browser deployments.

The goal is not to pretend a live map can stay fully current without connectivity. Instead, CrisisWeave keeps the last useful event snapshot and a minimal app shell so responders can still inspect what was known before the connection failed.

## Service-worker strategy

`sw.js` uses:

- cache-first for the local app shell
- network-first for JSON/JSONL event feeds, with cached fallback
- no automatic bulk caching of map tiles, which can consume large amounts of storage and create stale-data problems

## Integration

Copy `sw.js` beside `index.html` in `crisisweave-map`. The map already attempts to register `./sw.js` when service workers are supported.

For a production deployment, set the `APP_SHELL` list in `sw.js` to the exact local assets you want available offline.

## Important limitation

An offline snapshot is historical context, not proof that conditions are unchanged. Interfaces should visibly show the timestamp of the last successful refresh before operational use.
