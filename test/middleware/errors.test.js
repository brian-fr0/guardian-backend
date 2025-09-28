const chai = require("chai");
const sinon = require("sinon");
const HttpError = require("../../src/utils/http-error");
const HttpResponse = require("../../src/utils/http-response-helper");
const ExpressMockResponse = require("../testing-utils/expressResponse");
const ExpressMockRequest = require("../testing-utils/expressRequest");
const HttpErrorMiddleware = require("../../src/middleware/errors.middleware");
const {
  INTERNAL_UNAUTHORIZED_STATE,
} = require("../../src/utils/critical-error");

const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("ErrorMiddleware", () => {
  /** @type {import("../testing-utils/expressRequest").RequestMock} */
  let req;
  /** @type {import("../testing-utils/expressResponse").ResponseMock} */
  let res;

  let next;

  let handleLoggingStub;

  beforeEach(() => {
    req = ExpressMockRequest.new();
    res = ExpressMockResponse.new();

    next = sinon.spy();

    handleLoggingStub = sinon.stub(HttpError.prototype, "handleLogging");
  });

  afterEach(() => {
    sinon.restore();
    req = null;
    res = null;
  });

  it("should build a HttpResponse out of an Error and send that response to the client", () => {
    const err = new Error("something went wrong");

    HttpErrorMiddleware(err, req, res, next);

    expect(res.statusCode).to.be.equal(500);
    sinon.assert.notCalled(next);
    sinon.assert.calledOnce(handleLoggingStub);
  });

  it("should build a HttpResponse out of an HttpError", () => {
    const err = new HttpError({ code: 401 });

    HttpErrorMiddleware(err, req, res, next);

    expect(res.statusCode).to.be.equal(401);
    sinon.assert.notCalled(next);
    sinon.assert.calledOnce(handleLoggingStub);
  });

  it("should call next when the error is instance of CriticalError", () => {
    HttpErrorMiddleware(INTERNAL_UNAUTHORIZED_STATE, req, res, next);

    sinon.assert.calledOnceWithExactly(next, INTERNAL_UNAUTHORIZED_STATE);
    expect(res.headersSent).to.be.false;
  });
});
