'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/my-work/requests',
      handler: 'work-request.create',
      config: {
        auth: false,
      },
    },
  ],
};
