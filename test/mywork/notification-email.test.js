'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { notificationRecipients, adminRequestUrl, emailText } = require('../../src/api/work-request/services/notification-email');

test('lit les destinataires et copies depuis les variables MyWork', () => {
  assert.deepEqual(notificationRecipients({
    MYWORK_NOTIFICATION_TO: 'enio.sadflower@gmail.com',
    MYWORK_NOTIFICATION_CC: '  one@example.com, two@example.com ',
  }), {
    to: ['enio.sadflower@gmail.com'],
    cc: ['one@example.com', 'two@example.com'],
  });
});

test('construit un résumé complet sans HTML', () => {
  const text = emailText({
    publicId: 'request-1', kind: 'quote', serviceLabel: 'Site web', serviceCode: 'developer.website', serviceCategory: 'developer', name: 'Ada', email: 'ada@example.com', phone: '', preferredDate: null, message: 'Bonjour', consentAt: '2026-07-28T12:00:00.000Z',
  });
  assert.match(text, /Identifiant : request-1/);
  assert.match(text, /Message : Bonjour/);
  assert.match(text, /Téléphone : Non renseigné/);
});

test('construit le lien direct vers une demande Strapi', () => {
  const request = { documentId: 'abc123' };
  assert.equal(
    adminRequestUrl(request, { MYWORK_ADMIN_URL: 'https://sadflower-backend.herokuapp.com/admin/' }),
    'https://sadflower-backend.herokuapp.com/admin/content-manager/collection-types/api%3A%3Awork-request.work-request/abc123'
  );
});
