'use strict';

const crypto = require('node:crypto');
const { validateRequest } = require('./request-validation');
const { createRateLimiter } = require('./rate-limit');

const UID = 'api::work-request.work-request';
const MAX_BODY_SIZE = 16 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const rateLimiter = createRateLimiter({ perTenMinutes: 5, perDay: 20, perEmailHour: 3 });

function requestError(status, code, message, fields, retryAfter) {
  return { status, code, message, fields, retryAfter };
}

function readCatalog() {
  try {
    const catalog = JSON.parse(process.env.MYWORK_SERVICE_CATALOG || '{}');
    if (!catalog || Array.isArray(catalog) || typeof catalog !== 'object') throw new Error('invalid');
    return catalog;
  } catch {
    throw requestError(500, 'CONFIGURATION_ERROR', 'Service unavailable');
  }
}

function readSecret() {
  const secret = process.env.MYWORK_RATE_LIMIT_SECRET || process.env.APP_KEYS?.split(',')[0];
  if (!secret) throw requestError(500, 'CONFIGURATION_ERROR', 'Service unavailable');
  return secret;
}

function hash(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function publicResponse(publicId, receivedAt) {
  return {
    requestId: publicId,
    state: 'received',
    receivedAt: new Date(receivedAt).toISOString(),
  };
}

function getIp(ctx) {
  return ctx.request.ip || ctx.ip || 'unknown';
}

function assertBodySize(payload) {
  if (Buffer.byteLength(JSON.stringify(payload || {}), 'utf8') > MAX_BODY_SIZE) {
    throw requestError(413, 'PAYLOAD_TOO_LARGE', 'Payload too large');
  }
}

async function findIdempotentRequest(documents, idempotencyKeyHash) {
  return documents.findFirst({
    filters: { idempotencyKeyHash },
    fields: ['publicId', 'payloadHash', 'createdAt'],
  });
}

async function submit({ strapi, ctx }) {
  const payload = ctx.request.body;
  assertBodySize(payload);
  const catalog = readCatalog();
  const validation = validateRequest(payload, catalog);

  if (!validation.valid) {
    throw requestError(422, validation.code, 'Invalid request', validation.fields);
  }

  if (validation.isHoneypot) {
    return { status: 201, data: publicResponse(crypto.randomUUID(), Date.now()) };
  }

  const idempotencyKey = ctx.get('Idempotency-Key');
  if (idempotencyKey && !UUID_PATTERN.test(idempotencyKey)) {
    throw requestError(422, 'VALIDATION_ERROR', 'Invalid request', {
      'Idempotency-Key': 'invalid',
    });
  }

  const secret = readSecret();
  const documents = strapi.documents(UID);
  const payloadHash = hash(secret, JSON.stringify(validation.data));
  const idempotencyKeyHash = idempotencyKey ? hash(secret, idempotencyKey) : null;

  if (idempotencyKeyHash) {
    const existing = await findIdempotentRequest(documents, idempotencyKeyHash);
    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        throw requestError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key already used');
      }
      return { status: 200, data: publicResponse(existing.publicId, existing.createdAt) };
    }
  }

  const ipHash = hash(secret, getIp(ctx));
  const emailHash = hash(secret, validation.data.email);
  const limit = rateLimiter.consume(ipHash, emailHash);
  if (!limit.allowed) {
    throw requestError(429, 'RATE_LIMITED', 'Too many requests', undefined, limit.retryAfter);
  }

  const now = new Date();
  const publicId = crypto.randomUUID();
  const { consent, ...persistedData } = validation.data;
  await documents.create({
    data: {
      ...persistedData,
      publicId,
      consentAt: now.toISOString(),
      status: 'new',
      source: 'mywork',
      idempotencyKeyHash,
      payloadHash,
      ipHash,
      emailHash,
      userAgent: String(ctx.get('User-Agent') || '').slice(0, 512),
    },
  });

  return { status: 201, data: publicResponse(publicId, now) };
}

module.exports = { submit };
