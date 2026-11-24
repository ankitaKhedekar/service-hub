// Website copy and page data in one place, so you can edit text without touching components.

export interface Industry {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  intro: string;
  examples: string[];
  categorySlugs: string[]; // links to real categories in the database
  benefits: { title: string; text: string }[];
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'home-services', name: 'Home services', icon: 'home',
    tagline: 'Cleaning, repairs and maintenance, booked in minutes.',
    intro: 'From a dripping tap to a full deep clean, customers pick a verified professional and a free time slot without a single phone call.',
    examples: ['Deep cleaning', 'Plumbing', 'Electrical work', 'AC repair', 'Painting', 'Pest control'],
    categorySlugs: ['cleaning', 'plumbing', 'electrical', 'ac-repair', 'painting'],
    benefits: [
      { title: 'Only real free slots', text: 'Customers see times that fit your working hours, breaks and days off.' },
      { title: 'Address with every booking', text: 'Each request includes the service address and notes, so you arrive prepared.' },
      { title: 'No double-booking', text: 'Two customers can never take the same slot, even at the same second.' },
    ],
  },
  {
    slug: 'beauty-wellness', name: 'Beauty & wellness', icon: 'sparkle',
    tagline: 'Salon, spa and grooming services at home.',
    intro: 'Stylists, beauticians and therapists fill their calendar with at-home appointments and keep every booking in one place.',
    examples: ['Haircut & styling', 'Facials', 'Massage', 'Bridal makeup', 'Manicure & pedicure'],
    categorySlugs: ['salon-at-home'],
    benefits: [
      { title: 'Services with set durations', text: 'A 45-minute facial and a 2-hour bridal package each take the right time on your calendar.' },
      { title: 'Ratings that build trust', text: 'Customers rate completed appointments, and your average shows on every service.' },
      { title: 'Breaks protected', text: 'Lunch breaks and days off are never offered to customers.' },
    ],
  },
  {
    slug: 'health-fitness', name: 'Health & fitness', icon: 'dumbbell',
    tagline: 'Personal training, yoga and physiotherapy sessions.',
    intro: 'Trainers and therapists offer recurring time slots, and clients book the session that suits them.',
    examples: ['Personal training', 'Home yoga', 'Physiotherapy', 'Nutrition consultation'],
    categorySlugs: [],
    benefits: [
      { title: 'Flexible slot length', text: 'Offer 15, 30 or 60-minute grids to match your sessions.' },
      { title: 'No-show tracking', text: 'Mark missed sessions so your records stay accurate.' },
      { title: 'Clear history', text: 'Every booking keeps a timeline of who changed what and when.' },
    ],
  },
  {
    slug: 'education-tutoring', name: 'Education & tutoring', icon: 'book',
    tagline: 'Home tuition, music and language lessons.',
    intro: 'Tutors publish their subjects and hours; parents and students book lessons and see confirmations instantly.',
    examples: ['Maths tuition', 'Music lessons', 'Spoken English', 'Coding for kids'],
    categorySlugs: [],
    benefits: [
      { title: 'Weekly timetable', text: 'Set different hours for each day of the week.' },
      { title: 'Instant notifications', text: 'Students are told the moment you confirm or reschedule.' },
      { title: 'Reviews from parents', text: 'Good feedback helps new families choose you.' },
    ],
  },
  {
    slug: 'events', name: 'Events & photography', icon: 'party',
    tagline: 'Photographers, decorators and entertainers.',
    intro: 'Event professionals take bookings for longer services and block out days when they are already committed.',
    examples: ['Event photography', 'Decoration', 'DJ & music', 'Catering staff'],
    categorySlugs: [],
    benefits: [
      { title: 'Long services', text: 'Services up to 10 hours fit into your calendar correctly.' },
      { title: 'Block busy days', text: 'Add leave days for events you booked elsewhere.' },
      { title: 'Accept or decline', text: 'Every request waits for your confirmation.' },
    ],
  },
  {
    slug: 'auto-care', name: 'Auto care', icon: 'car',
    tagline: 'Car wash, detailing and doorstep servicing.',
    intro: 'Mechanics and detailers take doorstep bookings with the address and car details in the notes.',
    examples: ['Car wash', 'Interior detailing', 'Battery replacement', 'Bike servicing'],
    categorySlugs: [],
    benefits: [
      { title: 'Doorstep address', text: 'Know exactly where to go before you leave.' },
      { title: 'Daily schedule', text: 'See today\'s jobs in order on your dashboard.' },
      { title: 'Earnings at a glance', text: 'Monthly earnings from completed jobs, without spreadsheets.' },
    ],
  },
];

export interface Faq { q: string; a: string; }
export interface FaqGroup { id: string; title: string; items: Faq[]; }

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'customers', title: 'For customers', items: [
      { q: 'Do I need an account to browse services?', a: 'No. Anyone can browse services, providers and reviews. You only need a free account when you book.' },
      { q: 'How do I know a time slot is really free?', a: 'Slots are calculated live from the provider\'s working hours, breaks, days off and existing bookings. Taken slots are greyed out and cannot be selected.' },
      { q: 'What happens after I book?', a: 'Your booking starts as Pending. The provider confirms or declines it, and you get a notification. You can follow every change on the booking\'s status timeline.' },
      { q: 'Can I cancel a booking?', a: 'Yes, from My bookings, up to 2 hours before the start time. The slot is released for other customers straight away.' },
      { q: 'How do I pay?', a: 'You pay the provider directly after the service. Online payment is planned for a future version.' },
      { q: 'Can I review a provider?', a: 'Yes. After a booking is marked completed, you can give a 1 to 5 star rating and a comment, once per booking.' },
    ],
  },
  {
    id: 'providers', title: 'For service providers', items: [
      { q: 'How do I join as a provider?', a: 'Create a provider account with your business name and city. An admin reviews your application; once approved, your services appear to customers.' },
      { q: 'Can I set my own hours?', a: 'Yes. Set opening hours and a break for each day, choose your slot length (15, 30 or 60 minutes) and add days off.' },
      { q: 'Do I have to accept every booking?', a: 'No. Every request waits for you to accept or reject it.' },
      { q: 'What if a customer does not show up?', a: 'After the start time you can mark the booking as no-show. It stays in your history.' },
      { q: 'Can I change my prices later?', a: 'Yes. New prices apply to new bookings; existing bookings keep the price the customer agreed to.' },
    ],
  },
  {
    id: 'account', title: 'Account & security', items: [
      { q: 'Is my password safe?', a: 'Passwords are stored only as secure hashes, never as plain text, and every request is checked on the server.' },
      { q: 'Who can see my bookings?', a: 'Only you, the provider of that booking, and platform admins.' },
      { q: 'I forgot my password. What do I do?', a: 'Contact support from the Contact page and we will help you regain access.' },
    ],
  },
];

export interface HelpArticle { slug: string; topic: string; title: string; summary: string; steps?: string[]; body: string[]; }

export const HELP_TOPICS = [
  { id: 'booking', title: 'Booking a service', icon: 'calendar' },
  { id: 'managing', title: 'Managing bookings', icon: 'list' },
  { id: 'providers', title: 'For providers', icon: 'briefcase' },
  { id: 'account', title: 'Account & security', icon: 'lock' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'how-to-book', topic: 'booking', title: 'How to book a service', summary: 'Find a service, choose a slot and send your request.',
    steps: ['Search or pick a category on the Services page.', 'Open a service to see its price, duration and provider.', 'Choose a date, then a free time slot.', 'Enter the service address and any notes.', 'Press Confirm booking. Your booking is now Pending.'],
    body: ['You will get a notification when the provider confirms. You can follow the booking under My bookings.'],
  },
  {
    slug: 'greyed-out-slots', topic: 'booking', title: 'Why are some time slots greyed out?', summary: 'Greyed slots are already booked by someone else.',
    body: ['Service Hub only lets one customer hold a time slot. Slots that are already booked appear greyed out and crossed through.', 'If no slots appear at all, the provider is closed or on leave that day. Try another date.'],
  },
  {
    slug: 'booking-statuses', topic: 'managing', title: 'What booking statuses mean', summary: 'Pending, Confirmed, Completed, Cancelled, Rejected and No-show.',
    body: ['Pending: waiting for the provider to accept.', 'Confirmed: the provider accepted and will arrive at the booked time.', 'Completed: the service is done. You can now leave a review.', 'Cancelled: cancelled by you, the provider or support.', 'Rejected: the provider could not take the booking.', 'No-show: the provider marked that nobody was available at the address.'],
  },
  {
    slug: 'cancel-booking', topic: 'managing', title: 'How to cancel a booking', summary: 'Cancel for free up to 2 hours before the start time.',
    steps: ['Go to My bookings and open the booking.', 'Press Cancel booking and add a reason if you like.', 'Confirm. The provider is notified and the slot is released.'],
    body: ['Less than 2 hours before the start? Contact the provider or our support team.'],
  },
  {
    slug: 'become-provider', topic: 'providers', title: 'Becoming a provider', summary: 'Register, get approved and start taking bookings.',
    steps: ['Choose Offer services on the registration page.', 'Enter your business name and city.', 'Add your services and set your working hours while you wait.', 'Once an admin approves you, customers can find and book you.'],
    body: ['Approval usually depends on a complete profile. Add a short description of your business and your years of experience.'],
  },
  {
    slug: 'set-availability', topic: 'providers', title: 'Setting your hours and days off', summary: 'Control exactly which slots customers see.',
    steps: ['Open Availability in the provider portal.', 'Tick the days you work and set opening and closing times.', 'Add a break if you take one.', 'Choose a slot length: 15, 30 or 60 minutes.', 'Add days off under Leave and blocked dates, then save.'],
    body: ['Changes apply immediately. Bookings that already exist are not affected.'],
  },
  {
    slug: 'manage-requests', topic: 'providers', title: 'Accepting and completing bookings', summary: 'Respond to requests and keep statuses up to date.',
    body: ['New requests appear on your dashboard. Accept or reject each one.', 'After the start time, mark the booking as completed or no-show. Completed bookings count towards your monthly earnings and let customers review you.'],
  },
  {
    slug: 'account-security', topic: 'account', title: 'Keeping your account secure', summary: 'Simple steps to protect your account.',
    body: ['Use a password of at least 8 characters with letters and numbers, and do not reuse it on other sites.', 'Always log out on shared computers.', 'If you notice something unusual, contact support straight away.'],
  },
];

export interface BlogPost { slug: string; title: string; date: string; readMinutes: number; tag: string; excerpt: string; body: string[]; }

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'prepare-for-deep-cleaning', title: 'How to prepare your home for a deep clean', date: '2026-11-10', readMinutes: 4, tag: 'Home tips',
    excerpt: 'Five quick steps that help the cleaning team finish faster and do a better job.',
    body: [
      'A little preparation goes a long way. Clear countertops and tables so surfaces can be cleaned fully.',
      'Put away valuables and fragile items. Tell the team about anything that needs special care, using the notes field when you book.',
      'Make sure water and electricity are available, and secure pets in one room.',
      'Finally, walk through the house with the team at the start and point out priority areas.',
    ],
  },
  {
    slug: 'ac-service-before-summer', title: 'Why you should service your AC before summer', date: '2026-10-28', readMinutes: 3, tag: 'Maintenance',
    excerpt: 'A yearly service keeps cooling strong and electricity bills lower.',
    body: [
      'Dust-clogged filters make an AC work harder, which raises your electricity bill and shortens its life.',
      'A standard service cleans filters and coils, checks gas pressure and flushes the drain pipe.',
      'Book before the first heatwave: slots fill up quickly once temperatures rise.',
    ],
  },
  {
    slug: 'get-more-bookings', title: '5 ways providers can get more bookings', date: '2026-10-15', readMinutes: 5, tag: 'For providers',
    excerpt: 'Small profile changes that make customers choose you.',
    body: [
      'Write a clear description for each service: what is included, how long it takes and what the customer should prepare.',
      'Keep your working hours accurate so customers see plenty of real slots.',
      'Respond to requests quickly. Customers book again when they get fast confirmations.',
      'Mark jobs completed on time so customers can leave reviews.',
      'Price clearly. A fixed price with no surprises builds trust.',
    ],
  },
];

export interface Plan { id: string; name: string; monthly: number | null; tagline: string; features: string[]; cta: string; highlight?: boolean; }

// Demo pricing for the portfolio. Plans are not charged anywhere yet - change these before launch.
export const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', monthly: 0, tagline: 'For new professionals trying the platform.', cta: 'Start free',
    features: ['Up to 3 services', 'Online booking with free-slot calendar', 'Booking requests and notifications', 'Customer reviews'] },
  { id: 'pro', name: 'Pro', monthly: 499, tagline: 'For busy providers who want more bookings.', cta: 'Choose Pro', highlight: true,
    features: ['Unlimited services', 'Everything in Starter', 'Earnings dashboard', 'Leave days and custom slot length', 'Priority support'] },
  { id: 'business', name: 'Business', monthly: null, tagline: 'For teams and multi-location businesses.', cta: 'Contact us',
    features: ['Everything in Pro', 'Multiple staff (coming soon)', 'Dedicated account manager', 'Custom onboarding'] },
];
