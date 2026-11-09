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

/** Horizontal bars of different lengths: several statements, one average each. */
export function MultiScaleIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...base} className={className} strokeLinecap="round">
      <path d="M4 6h13M4 12h8M4 18h15" strokeWidth="3" />
    </svg>
  );
}

export function QuizIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      {...base}
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M10 2h4" />
    </svg>
  );
}

export function QaIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      {...base}
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h16v10H10l-4 4v-4H4z" />
      <path d="M12 12V8M9.5 10.5 12 8l2.5 2.5" />
    </svg>
  );
}

/** Small inline icons sized to the text they sit in (1em), for buttons and labels. */
const inline = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function UpvoteIcon({ className = 'size-[1em]' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...inline} className={className}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function CheckIcon({ className = 'size-[1em]' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...inline} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CloseIcon({ className = 'size-[1em]' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...inline} className={className}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

export function ArrowUpIcon({ className = 'size-[1em]' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...inline} className={className}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function ArrowDownIcon({ className = 'size-[1em]' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...inline} className={className}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}
