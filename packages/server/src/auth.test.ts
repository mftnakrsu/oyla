import { describe, expect, test } from 'vitest';
import { generateAdminToken, hashToken, passwordMatches, verifyToken } from './auth';

describe('admin tokens', () => {
  test('are 43-character base64url strings and unique', () => {
    const token = generateAdminToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateAdminToken()).not.toBe(token);
  });

  test('verify against their hash only', () => {
    const token = generateAdminToken();
    const hash = hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyToken(token, hash)).toBe(true);
    expect(verifyToken(`${token}x`, hash)).toBe(false);
    expect(verifyToken('', hash)).toBe(false);
    expect(verifyToken(token, 'not-a-hash')).toBe(false);
  });
});

describe('passwordMatches', () => {
  test('compares exactly', () => {
    expect(passwordMatches('secret', 'secret')).toBe(true);
    expect(passwordMatches('Secret', 'secret')).toBe(false);
    expect(passwordMatches('', 'secret')).toBe(false);
    expect(passwordMatches('a much longer guess', 'secret')).toBe(false);
  });
});
