import type { IncomingMessage } from 'node:http';
import { describe, expect, test } from 'vitest';
import { clientIp, normalizeIp, sameOrigin } from './client-ip';

function request(headers: Record<string, string>, remoteAddress = '10.0.0.1'): IncomingMessage {
  return { headers, socket: { remoteAddress } } as unknown as IncomingMessage;
}

describe('normalizeIp', () => {
  test('maps IPv4-mapped IPv6 to IPv4 and groups IPv6 by /64', () => {
    expect(normalizeIp('::ffff:192.0.2.7')).toBe('192.0.2.7');
    expect(normalizeIp('2001:db8:1:2:aaaa::1')).toBe('2001:db8:1:2::/64');
    expect(normalizeIp('2001:db8:1:2:bbbb::9')).toBe('2001:db8:1:2::/64');
    expect(normalizeIp('2001:db8::1')).toBe('2001:db8:0:0::/64');
  });
});

describe('clientIp', () => {
  test('ignores X-Forwarded-For without trusted proxies', () => {
    expect(clientIp(request({ 'x-forwarded-for': '1.1.1.1' }), 0)).toBe('10.0.0.1');
  });

  test('reads the entry the nearest trusted proxy appended', () => {
    expect(clientIp(request({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }), 1)).toBe('203.0.113.9');
    expect(clientIp(request({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9, 10.1.1.1' }), 2)).toBe(
      '203.0.113.9',
    );
  });
});

describe('sameOrigin', () => {
  test('accepts requests without Origin and from the same host', () => {
    expect(sameOrigin(request({ host: 'oyla.example' }), 0)).toBe(true);
    expect(sameOrigin(request({ host: 'oyla.example', origin: 'https://oyla.example' }), 0)).toBe(
      true,
    );
  });

  test('rejects other origins and garbage', () => {
    expect(sameOrigin(request({ host: 'oyla.example', origin: 'https://evil.example' }), 0)).toBe(
      false,
    );
    expect(sameOrigin(request({ host: 'oyla.example', origin: 'null' }), 0)).toBe(false);
  });

  test('accepts the forwarded host only behind a trusted proxy', () => {
    const proxied = request({
      host: 'internal:3000',
      origin: 'https://oyla.example',
      'x-forwarded-host': 'oyla.example',
    });
    expect(sameOrigin(proxied, 1)).toBe(true);
    expect(sameOrigin(proxied, 0)).toBe(false);
  });
});
