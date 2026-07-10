'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateRequest } = require('../../src/api/work-request/services/request-validation');

const catalog = {
  'developer.website': {
    category: 'developer',
    label: 'Site web',
    kinds: ['quote'],
  },
};

test('normalise une demande de devis valide', () => {
  const result = validateRequest(
    {
      kind: 'quote',
      serviceCode: 'developer.website',
      name: '  Ada Lovelace  ',
      email: 'ADA@EXAMPLE.COM',
      phone: ' +33 6 00 00 00 00 ',
      message: '  Création d’un site vitrine. ',
      consent: true,
      website: '',
    },
    catalog
  );

  assert.deepEqual(result, {
    valid: true,
    isHoneypot: false,
    data: {
      kind: 'quote',
      serviceCode: 'developer.website',
      serviceCategory: 'developer',
      serviceLabel: 'Site web',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+33 6 00 00 00 00',
      message: 'Création d’un site vitrine.',
      consent: true,
    },
  });
});

test('rejette les champs inconnus et un consentement absent', () => {
  const result = validateRequest(
    {
      kind: 'quote',
      serviceCode: 'developer.website',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      consent: false,
      status: 'accepted',
    },
    catalog
  );

  assert.equal(result.valid, false);
  assert.equal(result.code, 'VALIDATION_ERROR');
  assert.deepEqual(result.fields, {
    consent: 'required',
    status: 'unknown',
  });
});

test('rejette un service absent du catalogue', () => {
  const result = validateRequest(
    {
      kind: 'quote',
      serviceCode: 'developer.unknown',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      consent: true,
    },
    catalog
  );

  assert.deepEqual(result, {
    valid: false,
    code: 'UNKNOWN_SERVICE',
    fields: { serviceCode: 'unknown' },
  });
});

test('marque un honeypot rempli sans exposer les données', () => {
  const result = validateRequest(
    {
      kind: 'quote',
      serviceCode: 'developer.website',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      consent: true,
      website: 'https://spam.example',
    },
    catalog
  );

  assert.deepEqual(result, { valid: true, isHoneypot: true });
});
