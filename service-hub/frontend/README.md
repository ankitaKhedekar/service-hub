# Service Hub — Angular frontend

See the main [README](../README.md) for full setup.

```bat
cd frontend
npm install
npm start
```

Opens on http://localhost:4200 and talks to the API at `src/environments/environment.development.ts` (`http://localhost:5000/api`).
For production, set `apiUrl` in `src/environments/environment.ts`, then run `npm run build` (output: `dist/frontend/browser`).
