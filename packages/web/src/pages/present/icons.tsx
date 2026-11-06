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
export const EyeIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" {...base} className={className ?? base.className}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" {...base} className={className ?? base.className}>
    <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.4 3.3M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </svg>
);
export const ModerateIcon = () => (
  <svg aria-hidden="true" {...base}>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.1-7.5 9.5-4.4-1.4-7.5-4.9-7.5-9.5V6L12 3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const PeopleIcon = () => (
  <svg aria-hidden="true" {...base}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
  </svg>
);
