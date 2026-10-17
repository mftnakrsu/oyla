const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
} as const;

export function BarsIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...base} className={className} strokeLinecap="round">
      <path d="M4 6h10M4 12h16M4 18h7" strokeWidth="3" />
    </svg>
  );
}

export function CloudIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...base} className={className} strokeLinecap="round">
      <path d="M3 9h7M13 9h8M5 14h14M8 19h8" strokeWidth="2.5" />
      <path d="M8 4h5" strokeWidth="4" />
    </svg>
  );
}

export function NoteIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...base} className={className} strokeLinejoin="round">
      <path d="M5 4h14v12l-4 4H5z" />
      <path d="M15 20v-4h4M8 9h8M8 13h5" strokeLinecap="round" />
    </svg>
  );
}

export function ScaleIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...base} className={className} strokeLinecap="round">
      <path d="M5 20v-4M10 20v-8M15 20v-11M20 20V5" strokeWidth="3" />
    </svg>
  );
}
