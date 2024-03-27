'use strict';

/**
 * sad-gotchu service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::sad-gotchu.sad-gotchu');
