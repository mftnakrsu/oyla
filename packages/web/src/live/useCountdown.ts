import { useEffect, useState } from 'react';

/**
 * Milliseconds left until `closesAt` (a local Date.now() timestamp), ticking a few times a
 * second; null without a deadline. The server sent "closes in N ms", so the phone's own clock
 * only measures the elapsed time and never has to agree with the server's.
 */
export function useCountdown(closesAt: number | null): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (closesAt === null) return;
    setNow(Date.now());
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= closesAt) clearInterval(timer);
    }, 200);
    return () => clearInterval(timer);
  }, [closesAt]);
  return closesAt === null ? null : Math.max(0, closesAt - now);
}

/** The local deadline for a "closes in" value received just now. */
export function deadlineFrom(closesIn: number | undefined): number | null {
  return closesIn === undefined ? null : Date.now() + closesIn;
}
