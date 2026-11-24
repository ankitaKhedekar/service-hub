# Service Hub

A full-stack **service-booking platform** where **customers** book local professionals, **service providers** manage their bookings and working hours, and **admins** approve providers and oversee the platform.

**Live demo:** _coming soon_ · **Code:** [service-hub/](service-hub/) · **Docs:** [service-hub/docs](service-hub/docs)

<!-- Demo video: click "Edit" on this file, drag Service-Hub-Demo.mp4 here, then commit -->

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular (standalone components, signals, reactive forms, lazy-loaded routes), TypeScript |
| Backend | Node.js, Express, JWT, bcrypt, Joi validation, Helmet, rate limiting |
| Database | MongoDB with Mongoose |
| Testing | Jest, Supertest, mongodb-memory-server |
| Hosting | Vercel (frontend), Render (API), MongoDB Atlas |

## Features

**Customer:** search services by category, city and price · pick a date and a free time slot · book with address and notes · track every booking on a status timeline · cancel up to 2 hours before · rate and review completed jobs · notifications

**Service provider:** apply and get approved by an admin · dashboard with today's jobs, pending requests and monthly earnings · accept, reject, complete or mark no-show · manage services · set weekly hours, breaks, slot length and days off

**Admin:** dashboard with bookings per day, revenue and status breakdown · approve providers · manage categories and services · block users · search all bookings · read contact-form messages

**Public website:** dropdown mega-menu header, home page with live stats and real reviews, plus How it works, For providers, Pricing, Industries, Help center, FAQ, Blog, About, Contact and Safety pages

## Engineering highlights

- **No double-booking, even under simultaneous requests:** a MongoDB unique partial index on `{ providerId, slotKeys }` lets the database reject a second booking for the same time. A test proves that when two requests race, exactly one succeeds.
- **Permissions enforced on the server:** JWT authentication, role checks, and ownership checks on every booking.
- **One tested module for booking-status rules:** who can move a booking from which status to which.
- **Correct time zones:** UTC in the database, slots calculated in Asia/Kolkata.
- **Consistent API responses**, with validation on every request.

## Run it locally (Windows)

Requirements: Node.js 20+, MongoDB (local or Atlas).

```bash
# 1. API
cd service-hub/backend
npm install
cp .env.example .env      # then set MONGODB_URI, JWT_SECRET, SEED_PASSWORD
npm run seed
npm run dev               # http://localhost:5000/api/health

# 2. Frontend (new terminal)
cd service-hub/frontend
npm install
npm start                 # http://localhost:4200
```

| Role | Demo login |
|---|---|
| Customer | `customer@demo.com` |
| Provider | `provider@demo.com` |
| Admin | `admin@demo.com` |

The password for all three is the `SEED_PASSWORD` you set in `.env`.

## Tests

```bash
cd service-hub/backend
npm test
```

## Documentation

- [API reference](service-hub/docs/API.md)
- [Database design](service-hub/docs/DATABASE.md)
- [Architecture and design decisions](service-hub/docs/ARCHITECTURE.md)
- [Deployment guide](service-hub/docs/DEPLOYMENT.md)
- [Testing guide](service-hub/docs/TESTING.md)
- [Full project README](service-hub/README.md)

## Author

**Ankita Khedekar** · [GitHub](https://github.com/ankitaKhedekar)
