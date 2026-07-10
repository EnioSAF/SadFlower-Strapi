'use strict';

const ALLOWED_FIELDS = new Set([
  'kind',
  'serviceCode',
  'name',
  'email',
  'phone',
  'preferredDate',
  'message',
  'consent',
  'website',
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateRequest(payload, catalog) {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return {
      valid: false,
      code: 'VALIDATION_ERROR',
      fields: { body: 'invalid' },
    };
  }

  if (text(payload.website)) {
    return { valid: true, isHoneypot: true };
  }

  const fields = {};
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_FIELDS.has(key)) fields[key] = 'unknown';
  }

  const kind = text(payload.kind);
  const serviceCode = text(payload.serviceCode);
  const name = text(payload.name);
  const email = text(payload.email).toLowerCase();
  const phone = text(payload.phone);
  const message = text(payload.message);
  const preferredDate = text(payload.preferredDate);

  if (!['booking', 'quote'].includes(kind)) fields.kind = 'invalid';
  if (!serviceCode || serviceCode.length > 80) fields.serviceCode = 'invalid';
  if (name.length < 2 || name.length > 100) fields.name = 'invalid';
  if (!EMAIL_PATTERN.test(email) || email.length > 254) fields.email = 'invalid';
  if (phone.length > 30) fields.phone = 'invalid';
  if (message.length > 2000) fields.message = 'invalid';
  if (payload.consent !== true) fields.consent = 'required';

  if (preferredDate) {
    const date = new Date(preferredDate);
    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      fields.preferredDate = 'invalid';
    }
  }

  if (Object.keys(fields).length > 0) {
    return { valid: false, code: 'VALIDATION_ERROR', fields };
  }

  const service = catalog[serviceCode];
  if (!service || !service.category || !service.label) {
    return {
      valid: false,
      code: 'UNKNOWN_SERVICE',
      fields: { serviceCode: 'unknown' },
    };
  }

  if (Array.isArray(service.kinds) && !service.kinds.includes(kind)) {
    return {
      valid: false,
      code: 'UNKNOWN_SERVICE',
      fields: { serviceCode: 'unavailable_for_kind' },
    };
  }

  const data = {
    kind,
    serviceCode,
    serviceCategory: service.category,
    serviceLabel: service.label,
    name,
    email,
    consent: true,
  };
  if (phone) data.phone = phone;
  if (message) data.message = message;
  if (preferredDate) data.preferredDate = new Date(preferredDate).toISOString();

  return { valid: true, isHoneypot: false, data };
}

module.exports = { validateRequest };
