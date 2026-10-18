import type { IncomingMessage } from 'node:http';
import { isIPv6 } from 'node:net';

/** Expands "2001:db8::1" to its eight groups. */
function ipv6Groups(ip: string): string[] {
  const [head = '', tail = ''] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const missing = ip.includes('::') ? 8 - left.length - right.length : 0;
  return [...left, ...Array.from({ length: missing }, () => '0'), ...right];
}

/**
 * One key per client for rate limiting: IPv4-mapped addresses as plain IPv4, IPv6 by /64 prefix
 * (one home or phone usually owns a whole /64).
 */
export function normalizeIp(ip: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped?.[1]) return mapped[1];
  if (isIPv6(ip)) return `${ipv6Groups(ip.toLowerCase()).slice(0, 4).join(':')}::/64`;
  return ip;
}

/**
 * The client address of a raw request. With `trustedHops` proxies in front, the address is read
 * from the right end of X-Forwarded-For, where the nearest trusted proxy wrote it.
 */
export function clientIp(request: IncomingMessage, trustedHops: number): string {
  let ip = request.socket.remoteAddress ?? 'unknown';
  const forwarded = request.headers['x-forwarded-for'];
  if (trustedHops > 0 && typeof forwarded === 'string') {
    const chain = forwarded
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    ip = chain[chain.length - trustedHops] ?? ip;
  }
  return normalizeIp(ip);
}

/** Whether a browser Origin header belongs to the host the request was sent to. */
export function sameOrigin(request: IncomingMessage, trustedHops: number): boolean {
  const origin = request.headers.origin;
  if (!origin) return true; // not a browser cross-site request (CLI, tests, same-origin polling)
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hosts = [request.headers.host];
  const forwardedHost = request.headers['x-forwarded-host'];
  if (trustedHops > 0 && typeof forwardedHost === 'string')
    hosts.push(forwardedHost.split(',')[0]?.trim());
  return hosts.includes(originHost);
}
