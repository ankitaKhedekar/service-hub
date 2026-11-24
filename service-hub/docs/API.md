# API reference

Base URL: `http://localhost:5000/api` (local) or `https://api.yourdomain.com/api` (production).

## Conventions

**Authentication.** Send the token from login/register on every protected call:
```
Authorization: Bearer <token>
```
Tokens expire after `JWT_EXPIRES_IN` (default 7 days). The user's role is read from the database on every request, never trusted from the client.

**Responses.** Every response has the same shape.
```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 12, "total": 40, "pages": 4 } }
```
`meta` appears only on paginated lists. Errors look like this:
```json
{ "success": false, "message": "Please check the highlighted fields", "details": [{ "field": "email", "message": "email must be a valid email" }] }
```

**Status codes.** `200` OK · `201` created · `400` invalid input or rule broken · `401` not logged in / token expired · `403` wrong role or blocked · `404` not found (also used when you may not see something) · `409` conflict (slot taken, duplicate email) · `429` too many login attempts · `500` server error.

**Pagination.** Lists accept `page` (default 1) and `limit` (default 12, max 100).

**Times.** All timestamps are ISO 8601 in UTC (`2026-11-21T04:30:00Z`). Dates in query strings (`date`, `from`, `to`) are `YYYY-MM-DD` in the business timezone (`APP_TIMEZONE`, default Asia/Kolkata).

---

## Auth

### POST /auth/register
Creates a customer or provider. Admins cannot self-register.
```json
{ "name": "Priya Sharma", "email": "priya@example.com", "phone": "9876500001", "password": "secret123", "role": "customer" }
```
Providers also send `businessName` (required) and `city`. New providers start with `approvalStatus: "pending"` and a default weekly schedule.

`201` →
```json
{ "success": true, "data": { "token": "eyJ...", "user": { "id": "…", "name": "Priya Sharma", "email": "priya@example.com", "role": "customer", "isActive": true } } }
```
Password rules: 8–72 characters with letters and numbers. Duplicate email → `409`.

### POST /auth/login
```json
{ "email": "customer@demo.com", "password": "…" }
```
`200` → same as register. Wrong email or password → `401 "Invalid email or password"`. Blocked account → `403`. Limited to 20 attempts per 15 minutes per IP.

### GET /auth/me 🔒
Returns the current user. Providers also get `approvalStatus`.

---

## Public catalog

### GET /categories
Active categories with the number of bookable services.
```json
[{ "id": "…", "name": "AC repair", "slug": "ac-repair", "description": "", "serviceCount": 3 }]
```

### GET /services
Only active services of **approved, active** providers in **active** categories.

| Query | Example | Notes |
|---|---|---|
| `q` | `deep clean` | matches title or description |
| `category` | `ac-repair` | slug or id |
| `city` | `Bengaluru` | provider's city |
| `providerId` | `…` | one provider's services |
| `sort` | `price_asc`, `price_desc`, `newest` | default `newest` |

```json
{
  "id": "…", "title": "Split AC service", "description": "…", "price": 599, "durationMinutes": 60, "imageUrl": "", "isActive": true,
  "category": { "id": "…", "name": "AC repair", "slug": "ac-repair" },
  "provider": { "id": "…", "businessName": "CoolFix Services", "city": "Bengaluru", "avgRating": 4.7, "totalReviews": 12, "experienceYears": 6, "bio": "…" }
}
```

### GET /services/:id
One service, same shape. Hidden or unapproved → `404`.

### GET /services/:id/slots?date=2026-11-21
Every slot for that date, each marked available or not. Dates more than `BOOKING_WINDOW_DAYS` (default 30) ahead → `400`. Past dates return an empty list.
```json
{
  "date": "2026-11-21",
  "durationMinutes": 60,
  "slots": [
    { "start": "2026-11-21T03:30:00Z", "end": "2026-11-21T04:30:00Z", "label": "09:00 AM", "available": true },
    { "start": "2026-11-21T04:30:00Z", "end": "2026-11-21T05:30:00Z", "label": "10:00 AM", "available": false }
  ]
}
```
Slots come from the provider's weekly hours, minus breaks, leave days, past times and active bookings.

### GET /providers/:id
```json
{ "provider": { … }, "services": [ … ], "reviews": [{ "id": "…", "rating": 5, "comment": "…", "customerName": "Priya Sharma", "createdAt": "…" }] }
```

---

## Bookings

### POST /bookings 🔒 customer
```json
{ "serviceId": "…", "startTime": "2026-11-21T04:30:00Z", "address": "12, 4th Cross, Indiranagar, Bengaluru", "notes": "Gate code 1234" }
```
The server checks that:
1. the service and provider are bookable
2. `startTime` is exactly one of the slots from `/services/:id/slots`
3. the slot is still free

Then it saves the booking as `pending` with the price, duration and title copied from the service.

| Result | Status |
|---|---|
| Booked | `201` with the booking |
| Not a valid slot (wrong time, break, closed day) | `400` |
| Slot already taken, including two simultaneous requests | `409 "Sorry, this slot was just booked…"` |

Booking object:
```json
{
  "id": "…", "code": "SH-M3K2ABX7Q", "serviceId": "…", "serviceTitle": "Split AC service", "price": 599, "durationMinutes": 60,
  "startTime": "2026-11-21T04:30:00Z", "endTime": "2026-11-21T05:30:00Z", "address": "…", "notes": "", "status": "pending",
  "cancelReason": "", "reviewed": false, "createdAt": "…",
  "statusHistory": [{ "status": "pending", "byRole": "customer", "note": "Booking requested", "at": "…" }],
  "customer": { "id": "…", "name": "Priya Sharma", "phone": "…", "email": "…" },
  "provider": { "id": "…", "businessName": "CoolFix Services" }
}
```

### GET /bookings/my 🔒 customer
Query: `status` = `upcoming` (pending or confirmed, in the future), `past`, or any single status (`cancelled`, `completed`…). Also `from`, `to`, `page`.

### GET /bookings/:id 🔒
Visible to the booking's customer, the booking's provider, and admins. Anyone else gets `404`.

### PATCH /bookings/:id/status 🔒
```json
{ "status": "confirmed", "note": "See you then" }
```

| From | To | Customer (own) | Provider (own) | Admin |
|---|---|---|---|---|
| pending | confirmed | – | ✓ | ✓ |
| pending | rejected | – | ✓ | ✓ |
| pending | cancelled | ✓ (≥2 h before) | – | ✓ |
| confirmed | cancelled | ✓ (≥2 h before) | ✓ | ✓ |
| confirmed | completed | – | ✓ (after start) | ✓ (after start) |
| confirmed | no_show | – | ✓ (after start) | ✓ (after start) |

`completed`, `cancelled`, `rejected` and `no_show` are final. Cancelling or rejecting frees the slot at once. The other party gets a notification.

### POST /reviews 🔒 customer
```json
{ "bookingId": "…", "rating": 5, "comment": "Great work" }
```
Only for your own **completed** booking, once (`409` if repeated). Updates the provider's average rating.

---

## Notifications 🔒

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/notifications` | `{ unread, items: [{ id, type, message, link, isRead, createdAt }] }` (latest 30) |
| PATCH | `/notifications/:id/read` | Mark one as read |
| PATCH | `/notifications/read-all` | Mark all as read |

---

## Provider 🔒 provider

| Method | Endpoint | Body / query | Notes |
|---|---|---|---|
| GET | `/provider/profile` | – | Profile plus name, email, phone |
| PUT | `/provider/profile` | `businessName, bio, city, experienceYears, phone` | Any subset |
| GET | `/provider/stats` | – | `todayBookings, pendingRequests, monthEarnings, monthCompletedJobs, avgRating, totalReviews, approvalStatus` |
| GET | `/provider/services` | – | All my services, including hidden ones |
| POST | `/provider/services` | `categoryId, title, description, price, durationMinutes, imageUrl, isActive` | Category must be active |
| PUT | `/provider/services/:id` | same | Own services only |
| DELETE | `/provider/services/:id` | – | If the service has bookings it is **hidden** instead: `{ deleted: false, hidden: true }` |
| GET | `/provider/availability` | – | See below |
| PUT | `/provider/availability` | see below | Replaces the schedule |
| GET | `/provider/bookings` | `status, from, to, page` | Bookings for my services |

Availability body:
```json
{
  "slotIntervalMinutes": 60,
  "weekly": [
    { "day": 0, "isOpen": false, "start": "09:00", "end": "18:00" },
    { "day": 1, "isOpen": true, "start": "09:00", "end": "18:00", "breakStart": "13:00", "breakEnd": "14:00" }
  ],
  "leaves": ["2026-12-25"]
}
```
`weekly` must contain all 7 days (0 = Sunday). Closing time must be after opening, and break end after break start.

---

## Admin 🔒 admin

| Method | Endpoint | Body / query | Notes |
|---|---|---|---|
| GET | `/admin/stats` | `days` (1–90, default 7) | `totalBookings, revenue, activeProviders, pendingProviders, customers, newCustomers, perDay[], byStatus[], topServices[]` |
| GET | `/admin/providers` | `status=pending\|approved\|rejected`, `page` | Applications with owner details and service count |
| PATCH | `/admin/providers/:id/approval` | `{ status: "approved"\|"rejected", note }` | `:id` is the provider's user id; notifies the provider |
| GET | `/admin/categories` | – | All categories, with service counts |
| POST | `/admin/categories` | `{ name, description, isActive }` | Slug is generated; duplicate → `409` |
| PUT | `/admin/categories/:id` | same | |
| DELETE | `/admin/categories/:id` | – | `409` if it has services; deactivate it instead |
| GET | `/admin/services` | `q, page` | All services |
| PATCH | `/admin/services/:id/active` | `{ isActive }` | Hide or show |
| GET | `/admin/users` | `role, q, page` | |
| PATCH | `/admin/users/:id/status` | `{ isActive }` | Can't block yourself or other admins. Blocked users are logged out on their next request |
| GET | `/admin/bookings` | `status, q, from, to, page` | `q` matches code, service title, customer or provider name |

---

## Public website

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/site/stats` | – | `{ providers, completedBookings, categories, avgRating, reviews }` |
| GET | `/site/reviews?limit=6` | – | Recent reviews rated 4–5 with a comment: `{ rating, comment, customerName ("Priya S."), serviceTitle, providerName, providerId, createdAt }` |
| POST | `/site/newsletter` | `{ email }` | `201 { subscribed: true }`. Signing up twice is fine |
| POST | `/site/contact` | `{ name, email, topic, message, website }` | `201 { received: true }`. `topic` is general, booking, provider, partnership or other. `website` is a hidden honeypot that must be empty |

Newsletter and contact are limited to 10 requests per hour per IP.

Admin: `GET /admin/messages?status=new|replied|closed` (the `meta` also includes `subscribers`) and `PATCH /admin/messages/:id { status }`.

## Health

`GET /api/health` → `{ "success": true, "data": { "status": "ok", "time": "…" } }` (used by hosting health checks).
