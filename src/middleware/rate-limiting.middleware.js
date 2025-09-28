const HttpResponse = require("../utils/http-response-helper");
const MemoryStore = require("../utils/memory-store");

/**
 * @param {Object} param0
 * @param {number} [param0.ipLimit=10_000]
 * @param {number} [param0.userLimit=100]
 * @param {number} [param0.ipWindowMs=1000 * 60 * 60]
 * @param {number} [param0.userWindowMs=1000 * 60]
 */
function makeMiddleware({
  ipLimit = 10_000,
  userLimit = 100,
  ipWindowMs = 1000 * 60 * 60,
  userWindowMs = 1000 * 60,
} = {}) {
  const ipStore = new MemoryStore();
  const userStore = new MemoryStore();

  /**
   * @param {MemoryStore} store
   * @param {*} key
   */
  function incrementRequest(store, key) {
    if (!store.has(key)) {
      store.set(key, {
        requests: 1,
        firstRequest: Date.now(),
      });
      return;
    }

    store.updateKey(key, (rateLimitObj) => {
      rateLimitObj.requests++;
      return rateLimitObj;
    });
  }

  function incrementIpRequest(ip) {
    incrementRequest(ipStore, ip);
  }

  function incrementUserRequest(userId) {
    incrementRequest(userStore, userId);
  }

  function isRateLimited(store, key, limit, windowMs) {
    if (!store.has(key)) {
      return false;
    }

    const { requests, firstRequest } = store.get(key);
    if (Date.now() - firstRequest > windowMs) {
      store.set(key, { requests: 1, firstRequest: Date.now() });
      return false;
    }

    return requests > limit;
  }

  function isIpRateLimited(ip, limit, windowMs) {
    return isRateLimited(ipStore, ip, limit, windowMs);
  }

  function isUserRateLimited(userId, limit, windowMs) {
    return isRateLimited(userStore, userId, limit, windowMs);
  }

  /**
   * @param {import('express').Request} Request
   * @param {import('express').Response} Response
   * @param {import('express').NextFunction} NextFunction
   */
  return function rateLimitMiddleware(req, res, next) {
    if (isIpRateLimited(req.ip, ipLimit, ipWindowMs)) {
      return new HttpResponse(429).sendStatus(res);
    }
    incrementIpRequest(req.ip);

    if (!req.user) {
      return next();
    }

    if (isUserRateLimited(req.user, userLimit, userWindowMs)) {
      return new HttpResponse(429).sendStatus(res);
    }
    incrementUserRequest(req.user);

    next();
  };
}

module.exports = makeMiddleware;
