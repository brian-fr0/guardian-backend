const UserModel = require("../models/user.model");
const authenticationService = require("../services/authentication.service");
const HttpError = require("../utils/http-error");

/**
 * @param {import('express').Request} Request
 * @param {import('express').Response} Response
 * @param {import('express').NextFunction} NextFunction
 */
async function OfficerAuthorizationMiddleware(req, res, next) {
  if (!req.officer) {
    throw new HttpError({ code: 401 });
  }

  next();
}

module.exports = OfficerAuthorizationMiddleware;
