const chai = require("chai");
const sinon = require("sinon");
const HttpError = require("../../src/utils/http-error");

const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("HttpError", () => {
  describe("HttpError.constructor", () => {
    it("should append stack trace if error is not undefined", () => {
      const err = new Error("something went wrong");

      const httpError = new HttpError({}, err);

      expect(httpError.stack).to.include("something went wrong");
    });

    it("should set message from Error if Error is not undefined", () => {
      const err = new Error("something went wrong");

      const httpError = new HttpError({}, err);

      expect(httpError.message).to.be.equal("something went wrong");
    });
  });
});
