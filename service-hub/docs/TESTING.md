# Testing guide

## Automated tests

```bat
cd backend
npm test
```

The first run downloads a temporary MongoDB (about 100 MB), so it needs internet. Later runs are fast.

| Suite | File | Covers |
|---|---|---|
| Slot engine (unit) | `tests/unit/slots.test.js` | working hours, breaks, closed days, leave days, past times, overlap with taken cells, timezone conversion |
| Status rules (unit) | `tests/unit/bookingRules.test.js` | every allowed and blocked transition per role, cancel cutoff, complete-after-start |
| API (integration) | `tests/integration/api.test.js` | register/login, admin can't self-register, role checks, provider approval hides/shows services, booking, **double booking → 409**, **two simultaneous requests → exactly one 201**, invalid slot → 400, provider confirms → customer sees status, privacy (other customers get 404), cancel frees slot, leave days, admin stats, blocked user can't log in |

Run only the fast unit tests (no MongoDB needed): `npx jest tests/unit`

## Manual test checklist

Run `npm run seed` first, then start the API and the frontend.

### Customer: `customer@demo.com`
1. Home page shows categories and popular services. The Painting category is inactive and hidden.
2. **Services** → filter by category, search "AC", sort by price. Refresh: the filters stay (they are in the URL).
3. Open **Split AC service** → pick a date → booked slots are greyed out; a lunch-break slot (1 PM) is missing.
4. Pick a free slot, enter an address, **Confirm booking** → "Booking requested", status **Pending**.
5. **My bookings → Upcoming** shows it. Open it: the timeline shows "Booking requested".
6. Open a **Past → Completed** booking without a review → give 4 stars → "Thanks for your review".
7. Cancel an upcoming booking more than 2 hours away → status **Cancelled**; that slot is free again on the service page.
8. Try opening `/admin` → you are sent back to the home page.

### Provider: `provider@demo.com` (CoolFix Services)
1. Dashboard shows stats, **New booking requests**, and today's schedule.
2. **Accept** the customer's new booking → it disappears from requests.
3. Log back in as the customer → the booking shows **Confirmed**, with "Confirmed by provider" in the timeline and a notification.
4. **My services** → add a service, edit its price, hide it (untick "Visible") → it disappears from the public list.
5. **Availability** → close Saturday, add tomorrow as a day off, save → the service page shows no slots for those days.
6. **Bookings → Past** → mark yesterday's confirmed booking **completed**.

### Pending provider: `brightspark@demo.com`
1. Dashboard shows "waiting for admin approval".
2. Their "Fan installation" service is not visible in the public list.

### Admin: `admin@demo.com`
1. Dashboard shows totals, the bookings-per-day chart, the status breakdown and top services. Switch to "Last 30 days".
2. **Provider approvals** → approve BrightSpark → the Fan installation service now appears publicly (Electrical category).
3. **Categories** → add "Pest control"; try deleting "AC repair" (blocked: it has services); deactivate and reactivate Painting.
4. **Bookings** → search "SH-" or a customer name; filter by Pending; confirm or cancel one.
5. **Users** → block `rahul@demo.com` → logging in as Rahul shows "account has been blocked"; unblock him.

### Public website
1. Hover each menu (Services, Industries, For providers, Resources): the dropdown opens; Esc closes it; clicking a link navigates and closes it.
2. Narrow the browser below 960 px: the menu button opens a full-screen menu with expandable sections.
3. Home page shows live numbers, real reviews in the carousel (use the arrows), and the customer/provider preview toggle.
4. Pricing: switch Monthly/Yearly; prices change. Industries → open each industry page.
5. Help center: search "cancel" → the matching article appears.
6. Contact: send a message, then log in as admin → **Messages** shows it. Subscribe to the newsletter on the home page → the subscriber count increases.

### Double-booking check (two browsers)
1. Log in as `customer@demo.com` in Chrome and as `rahul@demo.com` in an incognito window.
2. Both open the same service, date and slot.
3. Click **Confirm** in both, quickly. One succeeds; the other shows "Sorry, this slot was just booked" and the slot list refreshes.

### API with curl (optional)
```bat
curl http://localhost:5000/api/health
curl "http://localhost:5000/api/services?category=ac-repair"
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@demo.com\",\"password\":\"YOUR_SEED_PASSWORD\"}"
```
