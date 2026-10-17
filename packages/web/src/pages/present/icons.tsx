const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-[1.4em]',
} as const;

export const PrevIcon = () => (
  <svg aria-hidden="true" {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const NextIcon = () => (
  <svg aria-hidden="true" {...base}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const ResetIcon = () => (
  <svg aria-hidden="true" {...base}>
    <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" />
  </svg>
);
export const InviteIcon = () => (
  <svg aria-hidden="true" {...base}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2M18 14h2v2M14 18v2h6" />
  </svg>
);
export const FullscreenIcon = () => (
  <svg aria-hidden="true" {...base}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const ExitIcon = () => (
  <svg aria-hidden="true" {...base}>
    <path d="M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10" />
  </svg>
);
export const PeopleIcon = () => (
  <svg aria-hidden="true" {...base}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
  </svg>
);
