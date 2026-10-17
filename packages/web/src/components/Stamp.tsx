import { useId } from 'react';

interface StampProps {
  size?: number;
  /** Text around the ring; omit for the plain mark. */
  label?: string;
  /** Plays the stamp-press animation once (reduced motion skips it). */
  press?: boolean;
  className?: string;
}

/** The Oyla rubber stamp: a double ring with a check mark, inked at a slight angle. */
export function Stamp({ size = 40, label, press = false, className = '' }: StampProps) {
  const id = useId();
  const grain = `${id}-grain`;
  const ring = `${id}-ring`;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      className={`text-stamp ${press ? 'stamp-press' : '-rotate-[8deg]'} ${className}`}
    >
      <defs>
        {/* Uneven ink: a little noise knocked out of the strokes. */}
        <filter id={grain}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.6 1.15" />
          <feComposite in="SourceGraphic" operator="in" />
        </filter>
        <path id={ring} d="M60 60 m-41 0 a41 41 0 1 1 82 0 a41 41 0 1 1 -82 0" />
      </defs>
      <g filter={`url(#${grain})`} fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="55" strokeWidth="7" />
        <circle cx="60" cy="60" r={label ? 30 : 38} strokeWidth="3" />
        <path
          d={label ? 'M47 61l9 9 17-19' : 'M40 62l13 13 27-30'}
          strokeWidth={label ? 7 : 10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {label ? (
          <text fill="currentColor" stroke="none" fontSize="15" fontWeight="800" letterSpacing="3">
            <textPath href={`#${ring}`} startOffset="50%" textAnchor="middle">
              {`${label.toLocaleUpperCase()} ★ ${label.toLocaleUpperCase()} ★`}
            </textPath>
          </text>
        ) : null}
      </g>
    </svg>
  );
}
