'use strict';

const { submit } = require('../services/work-request');
const { createCoreController } = require('@strapi/strapi').factories;

function errorResponse(error) {
  const status = error.status || 500;
  return {
    status,
    name: status === 500 ? 'InternalError' : 'ValidationError',
    message: error.message || 'Internal error',
    code: error.code || 'INTERNAL_ERROR',
    details: error.fields ? { fields: error.fields } : {},
  };
}

module.exports = createCoreController('api::work-request.work-request', ({ strapi }) => ({
  async create(ctx) {
    try {
      const result = await submit({ strapi, ctx });
      ctx.status = result.status;
      if (result.retryAfter) ctx.set('Retry-After', String(result.retryAfter));
      ctx.body = { data: result.data };
    } catch (error) {
      const response = errorResponse(error);
      ctx.status = response.status;
      if (error.retryAfter) ctx.set('Retry-After', String(error.retryAfter));
      ctx.body = { error: response };
    }
  },
}));
