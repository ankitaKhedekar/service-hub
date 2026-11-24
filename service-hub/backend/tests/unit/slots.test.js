const { generateSlots, buildSlotKeys } = require('../../src/utils/slots');

const TZ = 'Asia/Kolkata';
const availability = {
  slotIntervalMinutes: 60,
  leaves: ['2030-01-08'],
  weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day, isOpen: day !== 0, start: '09:00', end: '13:00', breakStart: '11:00', breakEnd: '12:00',
  })),
};
const longAgo = new Date('2020-01-01T00:00:00Z');

describe('buildSlotKeys', () => {
  test('one key per grid cell the booking covers', () => {
    expect(buildSlotKeys('2030-01-07T03:30:00Z', 120, 60)).toEqual(['2030-01-07T03:30:00Z', '2030-01-07T04:30:00Z']);
    expect(buildSlotKeys('2030-01-07T03:30:00Z', 45, 30)).toHaveLength(2);
  });
});

describe('generateSlots', () => {
  test('skips the break and stays inside working hours', () => {
    // 2030-01-07 is a Monday
    const slots = generateSlots({ date: '2030-01-07', availability, durationMinutes: 60, now: longAgo, timezone: TZ });
    expect(slots.map((s) => s.label)).toEqual(['09:00 AM', '10:00 AM', '12:00 PM']);
    expect(slots[0].start).toBe('2030-01-07T03:30:00Z'); // 09:00 IST = 03:30 UTC
  });

  test('a 2-hour service cannot overlap the break', () => {
    const slots = generateSlots({ date: '2030-01-07', availability, durationMinutes: 120, now: longAgo, timezone: TZ });
    expect(slots.map((s) => s.label)).toEqual(['09:00 AM']);
  });

  test('closed days and leave days have no slots', () => {
    expect(generateSlots({ date: '2030-01-06', availability, durationMinutes: 60, now: longAgo, timezone: TZ })).toEqual([]); // Sunday
    expect(generateSlots({ date: '2030-01-08', availability, durationMinutes: 60, now: longAgo, timezone: TZ })).toEqual([]); // leave
  });

  test('taken cells make overlapping slots unavailable', () => {
    const takenKeys = new Set(['2030-01-07T04:30:00Z']); // 10:00 IST is booked
    const slots = generateSlots({ date: '2030-01-07', availability, durationMinutes: 60, takenKeys, now: longAgo, timezone: TZ });
    expect(slots.find((s) => s.label === '10:00 AM').available).toBe(false);
    expect(slots.find((s) => s.label === '09:00 AM').available).toBe(true);
  });

  test('slots in the past are hidden', () => {
    const now = new Date('2030-01-07T04:00:00Z'); // 09:30 IST
    const slots = generateSlots({ date: '2030-01-07', availability, durationMinutes: 60, now, timezone: TZ });
    expect(slots.map((s) => s.label)).toEqual(['10:00 AM', '12:00 PM']);
  });
});
