'use strict';

const TEN_MINUTES = 10 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

function createRateLimiter({ perTenMinutes, perDay, perEmailHour = 3 }) {
  const ipEvents = new Map();
  const emailEvents = new Map();

  function prune(events, cutoff) {
    while (events.length && events[0] <= cutoff) events.shift();
  }

  function consume(ipHash, emailHash, now = Date.now()) {
    const ip = ipEvents.get(ipHash) || [];
    const email = emailEvents.get(emailHash) || [];
    prune(ip, now - ONE_DAY);
    prune(email, now - ONE_HOUR);

    const recentIp = ip.filter((timestamp) => timestamp > now - TEN_MINUTES);
    if (recentIp.length >= perTenMinutes) {
      return {
        allowed: false,
        retryAfter: Math.ceil((recentIp[0] + TEN_MINUTES - now) / 1000),
      };
    }
    if (ip.length >= perDay) {
      return {
        allowed: false,
        retryAfter: Math.ceil((ip[0] + ONE_DAY - now) / 1000),
      };
    }
    if (email.length >= perEmailHour) {
      return {
        allowed: false,
        retryAfter: Math.ceil((email[0] + ONE_HOUR - now) / 1000),
      };
    }

    ip.push(now);
    email.push(now);
    ipEvents.set(ipHash, ip);
    emailEvents.set(emailHash, email);
    return { allowed: true };
  }

  return { consume };
}

module.exports = { createRateLimiter };
