require("dotenv").config();
const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

const sqlite3 = require("sqlite3");
const errorService = require("../../src/services/error-service");
const HttpError = require("../../src/utils/http-error");
const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");
const { ZodError } = require("zod");

describe("ErrorService", () => {
  describe("handleSqlErrors", () => {
    it("given a SQLite error, transform it into a HttpError", () => {
      const sqliteError = new Error();
      sqliteError.errno = sqlite3.CONSTRAINT;

      /** @type {HttpError} */
      const httpError = errorService.handleSqliteErrors(sqliteError);

      expect(httpError).to.be.instanceOf(HttpError);
      expect(httpError.code).to.be.equal(400);
    });

    it("given a error that is not a SQLite error, do nothing and return the Error", () => {
      const err = new Error("something went wrong");

      const httpError = errorService.handleSqliteErrors(err);

      expect(httpError).to.not.be.instanceOf(HttpError);
    });
  });

  describe("handleJwtExpiredError", () => {
    it("return a 401 HttpError", () => {
      /** @type {HttpError} */
      const httpError = errorService.handleJwtExpiredError();

      expect(httpError).to.be.instanceOf(HttpError);
      expect(httpError.code).to.be.equal(401);
      expect(httpError.clientMessage).to.be.equal("Access Token Expired");
    });
  });

  describe("handleJwtError", () => {
    it("given a JWT JsonWebTokenError, transform it into a HttpError", () => {
      const jwtErr = new JsonWebTokenError();

      /** @type {HttpError} */
      const httpError = errorService.handleJwtError(jwtErr);

      expect(httpError).to.be.instanceOf(HttpError);
      expect(httpError.code).to.be.equal(401);
    });
  });

  describe("handleZodError", () => {
    it("given a ZodError, transform it into a HttpError", () => {
      const zodErr = new ZodError([
        {
          expected: "string",
          code: "invalid_type",
          path: ["username"],
          message: "Invalid input: expected string, received number",
        },
      ]);

      /** @type {HttpError} */
      const httpError = errorService.handleZodError(zodErr);

      expect(httpError).to.be.instanceOf(HttpError);
      expect(httpError.code).to.be.equal(400);
      expect(httpError?.data?.properties).to.have.property("username");
    });
  });

  describe("handleHttpError", () => {
    it("given a Error, transform it into a 500 HttpError", () => {
      const err = new Error("System Failed");

      /** @type {HttpError} */
      const httpError = errorService.handleHttpError(err);

      expect(httpError).to.be.instanceOf(HttpError);
      expect(httpError.code).to.be.equal(500);
    });

    it("given a HttpError, transform it into a new HttpError and sets it id", () => {
      const err = new HttpError({ code: 400 });

      /** @type {HttpError} */
      const httpError = errorService.handleHttpError(err, 1);

      expect(httpError.id).to.be.equal(1);
    });

    it("given a Error, transform it into a HttpError and sets its path", () => {
      const err = new Error("System Failed");

      /** @type {HttpError} */
      const httpError = errorService.handleHttpError(err, 1, "/");

      expect(httpError.path).to.be.equal("/");
    });

    it("given a Error, transform it into a HttpError and sets its status code", () => {
      const err = new Error("Bad Request");

      /** @type {HttpError} */
      const httpError = errorService.handleHttpError(err, 1, "/", 400);

      expect(httpError.code).to.be.equal(400);
    });

    it("given a Error, transform it into a HttpError and sets its message", () => {
      const err = new Error("Bad Request");

      /** @type {HttpError} */
      const httpError = errorService.handleHttpError(
        err,
        1,
        "/",
        400,
        "Bad Input",
      );

      expect(httpError.clientMessage).to.be.equal("Bad Input");
    });

    it("given a HttpError, do nothing and return the same Error", () => {
      const err = new HttpError({ code: 329 });

      /** @type {HttpError} */
      const httpError = errorService.handleHttpError(err);

      expect(httpError).to.be.instanceOf(HttpError);
      expect(httpError.code).to.be.equal(329);
    });
  });

  describe("handleError", () => {
    it("should handle ZodError", () => {
      const zodError = new ZodError([]);
      const error = errorService.handleError(zodError);

      expect(error).to.be.instanceOf(HttpError);
      expect(error.code).to.be.equal(400);
    });

    it("should handle JWT TokenExpiredError", () => {
      const jwtExpiredError = new TokenExpiredError(
        "token expired",
        new Date(),
      );
      const error = errorService.handleError(jwtExpiredError);

      expect(error).to.be.instanceOf(HttpError);
      expect(error.code).to.be.equal(401);
    });

    it("should handle JWT JsonWebTokenError", () => {
      const jwtError = new JsonWebTokenError("invalid token");
      const error = errorService.handleError(jwtError);

      expect(error).to.be.instanceOf(HttpError);
      expect(error.code).to.be.equal(401);
    });

    it("should handle SQLite Errors", () => {
      const sqliteError = new Error("constraint failed");
      sqliteError.errno = sqlite3.CONSTRAINT;
      const error = errorService.handleError(sqliteError);

      expect(error).to.be.instanceOf(HttpError);
      expect(error.code).to.be.equal(400);
    });

    it("should handle uknown errors as 500", () => {
      const unknownError = new Error("something went wrong");
      const error = errorService.handleError(unknownError);

      expect(error).to.be.instanceOf(HttpError);
      expect(error.code).to.be.equal(500);
    });
  });
});
