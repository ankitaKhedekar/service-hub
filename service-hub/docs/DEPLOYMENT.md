# Deployment guide

Target setup (all have free tiers):

| Part | Host | Address |
|---|---|---|
| Database | MongoDB Atlas | private connection string |
| API | Render (Web Service) | `https://api.yourdomain.com` |
| Frontend | Vercel | `https://www.yourdomain.com` |

Replace `yourdomain.com` with the domain you bought (GoDaddy, Namecheap, Hostinger, Cloudflare…). Free plans and dashboards change over time, so check each provider's current pricing page.

---

## 1. Put the code on GitHub

```bat
cd service-hub
git init
git add .
git commit -m "Service Hub: full-stack service booking platform"
git branch -M main
git remote add origin https://github.com/<your-username>/service-hub.git
git push -u origin main
```
Run `git status` before committing: `.env` must **not** be listed. The `.gitignore` already excludes it.

## 2. MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/atlas.
2. **Database Access** → add a database user with a strong password.
3. **Network Access** → add `0.0.0.0/0`. Render's free plan has no fixed IP; the strong password protects the database.
4. **Connect → Drivers** → copy the connection string and add the database name:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/service_hub?retryWrites=true&w=majority`
5. Load demo data from your PC: put this string in `backend\.env` as `MONGODB_URI` and run `npm run seed` (with `NODE_ENV=development`).

## 3. API on Render

1. https://render.com → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - Root directory: `backend`
   - Build command: `npm ci`
   - Start command: `npm start`
   - Health check path: `/api/health`
3. Environment variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas string |
| `JWT_SECRET` | long random text (Render can generate one) |
| `CORS_ORIGINS` | `https://www.yourdomain.com,https://yourdomain.com` (for testing, also add your `*.vercel.app` URL) |
| `APP_TIMEZONE` | `Asia/Kolkata` |

4. Deploy, then open `https://<service>.onrender.com/api/health`.

Alternatively, `render.yaml` in the repo root works as a Render Blueprint.

> Free Render services sleep after inactivity, so the first request can take up to a minute. Before an interview, open the site once to wake it up, or use a paid instance.

## 4. Frontend on Vercel

1. Set the production API address in `frontend/src/environments/environment.ts`:
   ```ts
   apiUrl: 'https://api.yourdomain.com/api',
   ```
   (Use the `onrender.com` address until the custom domain is ready.) Commit and push.
2. https://vercel.com → **Add New → Project** → import the repo.
   - Root directory: `frontend`
   - Framework preset: Angular
   - Build command: `npm run build`
   - Output directory: `dist/frontend/browser`
3. Deploy. `frontend/vercel.json` sends every route to `index.html`, so refreshing `/bookings` works.

(Netlify works too: same settings. `public/_redirects` handles the routing.)

## 5. Custom domain with `www` and HTTPS

### Frontend: `www.yourdomain.com`
1. Vercel → Project → **Settings → Domains** → add `www.yourdomain.com`, then add `yourdomain.com` and choose **redirect to www**.
2. At your domain registrar's DNS settings, add the records Vercel shows, typically:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `cname.vercel-dns.com` |
| A | `@` | `76.76.21.21` |

Use the exact values Vercel displays for your project.

### API: `api.yourdomain.com`
1. Render → service → **Settings → Custom Domains** → add `api.yourdomain.com`.
2. At your registrar, add the record Render shows:

| Type | Name | Value |
|---|---|---|
| CNAME | `api` | `<service>.onrender.com` |

### HTTPS
Both Vercel and Render issue free Let's Encrypt certificates once DNS points to them. DNS can take from a few minutes to 24 hours. When both show "Valid", check that:
- `https://www.yourdomain.com` loads with a padlock
- `https://yourdomain.com` redirects to `www`
- `https://api.yourdomain.com/api/health` returns `ok`

Finally:
- Make sure `CORS_ORIGINS` on Render includes `https://www.yourdomain.com`.
- Make sure `environment.ts` points to `https://api.yourdomain.com/api`, then redeploy.

## 6. Final checks

- [ ] Log in with all three demo accounts on the live site
- [ ] Book a slot as a customer, confirm it as the provider, and see "Confirmed" as the customer
- [ ] Try booking the same slot from a second customer: you get a "just booked" message
- [ ] Refresh on a deep link such as `/bookings`: the page loads (no 404)
- [ ] Open the site on your phone
- [ ] Add the live link to `README.md` under **Live demo**, and to your resume

## Troubleshooting

| Problem | Fix |
|---|---|
| Browser console shows a CORS error | Add the exact frontend origin (with `https://`, no trailing slash) to `CORS_ORIGINS` and redeploy the API |
| "Cannot reach the server" in the app | Check `apiUrl` in `environment.ts` and that the API health URL works |
| API crashes at start with "Missing required environment variable" | Set `MONGODB_URI` and `JWT_SECRET` on Render |
| `MongoServerSelectionError` | Atlas Network Access must allow Render (`0.0.0.0/0`), and the password in the URI must be URL-encoded |
| Refreshing a page gives 404 | Check `vercel.json` (or `_redirects`) is in the deployed frontend root |
| Times look shifted | `APP_TIMEZONE` must be the same on the API as the frontend `environment.timezone` |
