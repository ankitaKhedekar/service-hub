// Slot generation. Pure functions (no database) so they are easy to unit test.
//
// How double-booking is prevented:
//   The provider's day is split into a grid of cells (e.g. every 30 or 60 minutes).
//   A booking stores the start time of every cell it covers in `slotKeys`.
//   MongoDB has a UNIQUE index on { providerId, slotKeys } for active bookings,
//   so two active bookings can never share a cell - even if two requests arrive at the same moment.

const { DateTime } = require('luxon');

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

/** The UTC ISO keys of every grid cell a booking covers. */
function buildSlotKeys(startUtc, durationMinutes, intervalMinutes) {
  const cells = Math.ceil(durationMinutes / intervalMinutes);
  const start = DateTime.fromJSDate(new Date(startUtc), { zone: 'utc' });
  const keys = [];
  for (let i = 0; i < cells; i += 1) {
    keys.push(start.plus({ minutes: i * intervalMinutes }).toISO({ suppressMilliseconds: true }));
  }
  return keys;
}

/**
 * Generate every slot for a provider on a date.
 * @param {object} p
 * @param {string} p.date        'YYYY-MM-DD' in the app timezone
 * @param {object} p.availability { weekly: [{day,isOpen,start,end,breakStart,breakEnd}], leaves: ['YYYY-MM-DD'], slotIntervalMinutes }
 * @param {number} p.durationMinutes
 * @param {Set<string>} p.takenKeys slot keys already held by active bookings
 * @param {Date} p.now
 * @param {string} p.timezone
 * @returns {Array<{start:string,end:string,label:string,available:boolean}>}
 */
function generateSlots({ date, availability, durationMinutes, takenKeys = new Set(), now = new Date(), timezone }) {
  if (!availability) return [];
  const day = DateTime.fromISO(date, { zone: timezone });
  if (!day.isValid) return [];
  if ((availability.leaves || []).includes(date)) return [];

  const dow = day.weekday % 7; // luxon: Mon=1..Sun=7 -> Sun=0..Sat=6
  const hours = (availability.weekly || []).find((d) => d.day === dow);
  if (!hours || !hours.isOpen) return [];

  const interval = availability.slotIntervalMinutes || 60;
  const open = toMinutes(hours.start);
  const close = toMinutes(hours.end);
  const hasBreak = hours.breakStart && hours.breakEnd;
  const breakStart = hasBreak ? toMinutes(hours.breakStart) : null;
  const breakEnd = hasBreak ? toMinutes(hours.breakEnd) : null;
  const nowDt = DateTime.fromJSDate(now);

  const slots = [];
  for (let m = open; m + durationMinutes <= close; m += interval) {
    const end = m + durationMinutes;
    if (hasBreak && m < breakEnd && end > breakStart) continue; // overlaps the break

    const startDt = day.startOf('day').plus({ minutes: m });
    if (startDt <= nowDt) continue; // in the past

    const startUtc = startDt.toUTC();
    const keys = buildSlotKeys(startUtc.toJSDate(), durationMinutes, interval);
    slots.push({
      start: startUtc.toISO({ suppressMilliseconds: true }),
      end: startUtc.plus({ minutes: durationMinutes }).toISO({ suppressMilliseconds: true }),
      label: startDt.toFormat('hh:mm a'),
      available: keys.every((k) => !takenKeys.has(k)),
    });
  }
  return slots;
}

module.exports = { toMinutes, buildSlotKeys, generateSlots };
