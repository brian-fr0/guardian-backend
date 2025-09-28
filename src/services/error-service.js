const z = require("zod");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3");
const HttpError = require("../utils/http-error");

class ErrorService {
  /**
   * @param {Error} err
   * @param {string} id
   * @param {string} path
   */
  handleError(err, id = "", path = "") {
    if (err instanceof z.ZodError) {
      err = this.handleZodError(err);
    }

    if (err instanceof jwt.TokenExpiredError) {
      err = this.handleJwtExpiredError();
    }

    if (err instanceof jwt.JsonWebTokenError) {
      err = this.handleJwtError();
    }

    err = this.handleSqliteErrors(err);

    return this.handleHttpError(err, id, path);
  }

  /**
   * Wrap to HttpError with sane defaults; preserve id/path.
   * @param {Error} err
   */
  handleHttpError(
    err,
    id = "",
    path = "",
    code = 500,
    message = "Internal Server Error",
    body = {},
  ) {
    if (err instanceof HttpError) {
      err.id = id;
      err.path = path;
      return err;
    }

    // Pass id and path so they're logged
    return new HttpError(
      { code, clientMessage: message, data: body, id, path },
      err,
    );
  }

  handleZodError(err) {
    return new HttpError({ code: 400, clientMessage: "Bad Request", data: z.treeifyError(err) }, err);
  }

  handleJwtError() {
    return new HttpError({ code: 401, clientMessage: "Invalid Token" });
  }

  handleJwtExpiredError() {
    return new HttpError({ code: 401, clientMessage: "Access Token Expired" });
  }

  handleSqliteErrors(err) {
    // Map common SQLite constraint to 400
    if (err && err.errno && err.errno === sqlite3.CONSTRAINT) {
      return new HttpError({ code: 400, clientMessage: "Bad Request" }, err);
    }
    return err;
  }
}

const errorService = new ErrorService();
module.exports = errorService;
