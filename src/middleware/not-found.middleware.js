const HttpResponse = require("../utils/http-response-helper");

/**
 * @param {import('express').Request} Request
 * @param {import('express').Response} Response
 * @param {import('express').NextFunction} NextFunction
 */
function notFoundMiddleware(req, res, next) {
  return new HttpResponse(
    404,
    {},
    "<div style='flex; justify-items: center;'><h1>404</h1><p>Could not find the requested resource</p></div>",
  ).send(res);
}

module.exports = notFoundMiddleware;
