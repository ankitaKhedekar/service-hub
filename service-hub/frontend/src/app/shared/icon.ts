import { Component, computed, input } from '@angular/core';

/** Simple stroke icons (24x24). Add more paths here as needed. */
const PATHS: Record<string, string> = {
  calendar: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  check: 'M5 12l4 4 10-10',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  bell: 'M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6',
  home: 'M3 11l9-7 9 7v10H3zM9 21v-6h6v6',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  heart: 'M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z',
  book: 'M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3',
  dumbbell: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  party: 'M3 21l5-14 9 9zM14 3l1 2M19 6l2-1M17 10l3 1M12 7l1-3',
  car: 'M5 16l1.5-5h11L19 16M3 16h18v3H3zM7 19v2M17 19v2',
  wrench: 'M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2z',
  chat: 'M4 5h16v11H8l-4 4z',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5V14M12 17h.01',
  rupee: 'M6 4h12M6 9h12M9 4c4 0 6 2 6 5s-3 5-6 5H6l8 7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  chevron: 'M6 9l6 6 6-6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M6 6l12 12M18 6L6 18',
  map: 'M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  briefcase: 'M3 7h18v13H3zM8 7V4h8v3M3 13h18',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  phone: 'M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
};

@Component({
  selector: 'app-icon',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path [attr.d]="d()" />
    </svg>
  `,
  host: { class: 'icon' },
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input(20);
  readonly stroke = input(2);
  protected d = computed(() => PATHS[this.name()] ?? PATHS['sparkle']);
}
