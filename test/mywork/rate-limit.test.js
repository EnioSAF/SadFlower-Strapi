'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createRateLimiter } = require('../../src/api/work-request/services/rate-limit');

test('bloque une sixième demande IP dans la fenêtre de dix minutes', () => {
  const limiter = createRateLimiter({ perTenMinutes: 5, perDay: 20 });
  const baseTime = 1_700_000_000_000;

  for (let index = 0; index < 5; index += 1) {
    assert.deepEqual(limiter.consume('ip-hash', `email-${index}`, baseTime + index), {
      allowed: true,
    });
  }

  assert.deepEqual(limiter.consume('ip-hash', 'email-new', baseTime + 6), {
    allowed: false,
    retryAfter: 600,
  });
});

test('bloque une quatrième demande email dans une heure', () => {
  const limiter = createRateLimiter({ perTenMinutes: 5, perDay: 20, perEmailHour: 3 });
  const baseTime = 1_700_000_000_000;

  for (let index = 0; index < 3; index += 1) {
    assert.equal(limiter.consume(`ip-${index}`, 'email-hash', baseTime + index).allowed, true);
  }

  assert.deepEqual(limiter.consume('ip-new', 'email-hash', baseTime + 4), {
    allowed: false,
    retryAfter: 3600,
  });
});
