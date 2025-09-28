const chai = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const ExpressMockResponse = require("../testing-utils/expressResponse");
const ExpressMockRequest = require("../testing-utils/expressRequest");
const OfficerAuthorizationMiddleware = require("../../src/middleware/officer-authorization.middleware");
const HttpError = require("../../src/utils/http-error");

const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("OfficerAuthorizationMiddleware", () => {
  /** @type {import("../testing-utils/expressRequest").RequestMock} */
  let req;
  /** @type {import("../testing-utils/expressResponse").ResponseMock} */
  let res;

  let next;

  beforeEach(() => {
    req = ExpressMockRequest.new();
    res = ExpressMockResponse.new();

    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
    req = null;
    res = null;
  });

  it("should call next if req.officer is true", async () => {
    req.officer = 1;

    await OfficerAuthorizationMiddleware(req, res, next);

    sinon.assert.calledOnce(next);
  });

  it("should throw 401 http error req.officer is false", async () => {
    req.officer = 0;
    await expect(OfficerAuthorizationMiddleware(req, res, next))
      .to.be.rejectedWith(HttpError)
      .then((error) => {
        expect(error.code).to.be.equal(401);
      });
  });
});
