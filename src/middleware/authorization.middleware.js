const errorService = require("../services/error-service");
const authenticationService = require("../services/authentication.service");
const getJwtFromRequest = require("../utils/jwts");
const HttpError = require("../utils/http-error");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function AuthorisationMiddleware(req, _, next) {
  const tokens = getJwtFromRequest(req, "all");

  const payload = await authenticationService.verifyToken(tokens.access);

  req.user = payload.sub;
  req.officer = payload.is_officer;
  req.tokens = tokens;

  next();
}

module.exports = AuthorisationMiddleware;
