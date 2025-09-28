const authenticationService = require("src/services/authentication.service");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} _
 * @param {import('express').NextFunction} next
 */
async function LastSeenMiddleware(req, _, next) {
  await authenticationService.updateLastSeen(req.user);
  next();
}

module.exports = LastSeenMiddleware;
