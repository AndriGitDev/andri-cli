import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidContactEmail } from '../src/lib/contact-email.ts';

test('accepts basic contact addresses and the 254-character boundary', () => {
  for (const value of ['person@example.com', 'first.last+tag@sub.example.is', `${'a'.repeat(248)}@x.com`]) {
    assert.equal(isValidContactEmail(value), true);
  }
});

test('rejects invalid JSON types without coercion', () => {
  for (const value of [undefined, null, 42, {}, ['person@example.com'], true]) {
    assert.equal(isValidContactEmail(value), false);
  }
});

test('rejects malformed, whitespace and oversized addresses', () => {
  for (const value of ['', '@example.com', 'person@', 'person@example', 'person@.com',
    'person@example.', 'person@@example.com', 'person @example.com', 'person@example.com\n',
    `${'a'.repeat(249)}@x.com`, `person@${'.'.repeat(1_000_000)}`]) {
    assert.equal(isValidContactEmail(value), false);
  }
});
