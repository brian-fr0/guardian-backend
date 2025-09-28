const chai = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const ExpressMockResponse = require("../testing-utils/expressResponse");
const ExpressMockRequest = require("../testing-utils/expressRequest");
const setupBaseModelStubs = require("../testing-utils/baseModelMocks");
const {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} = require("../../src/constants/cookies");
const AuthorisationMiddleware = require("../../src/middleware/authorization.middleware");
const authenticationService = require("../../src/services/authentication.service");

const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("AuthorizationMiddleware", () => {
  /** @type {import("../testing-utils/expressRequest").RequestMock} */
  let req;
  /** @type {import("../testing-utils/expressResponse").ResponseMock} */
  let res;

  let next;
  let verifyTokenStub;

  before(() => {
    process.env.JWT_ACCESS_SECRET = "fakeAccessSecret";
    process.env.JWT_REFRESH_SECRET = "fakeRefreshSecret";
  });

  beforeEach(() => {
    req = ExpressMockRequest.new();
    res = ExpressMockResponse.new();

    next = sinon.spy();
    verifyTokenStub = sinon.stub(authenticationService, "verifyToken");
  });

  afterEach(() => {
    sinon.restore();
    req = null;
    res = null;
  });

  it("should call next if access token is valid", async () => {
    const accessToken = jwt.sign({ sub: 1 }, process.env.JWT_ACCESS_SECRET);
    req.cookies = {
      [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
    };

    const jwtPayload = {
      sub: 1,
      jti: "session_id",
    };
    verifyTokenStub.resolves(jwtPayload);

    await AuthorisationMiddleware(req, res, next);

    sinon.assert.calledOnce(next);
  });

  it("should throw if token is expired", async () => {
    const accessToken = jwt.sign(
      { sub: 1, exp: Math.floor(new Date(1).getTime() / 1000) },
      process.env.JWT_ACCESS_SECRET,
    );
    req.cookies = {
      [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
    };

    await expect(AuthorisationMiddleware(req, res, next)).to.be.rejected;
    sinon.assert.notCalled(next);
  });

  it("should throw if token is invalid", async () => {
    const accessToken = jwt.sign(
      { sub: 1, exp: Math.floor(new Date(1).getTime() / 1000) },
      "wrongSecret",
    );
    req.cookies = {
      [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
    };

    await expect(AuthorisationMiddleware(req, res, next)).to.be.rejected;
    sinon.assert.notCalled(next);
  });

  it("should set req.tokens", async () => {
    const accessToken = jwt.sign({ sub: 1 }, process.env.JWT_ACCESS_SECRET);
    const refreshToken = jwt.sign({ sub: 1 }, process.env.JWT_REFRESH_SECRET);
    req.cookies = {
      [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
      [REFRESH_TOKEN_COOKIE_NAME]: refreshToken,
    };

    const jwtPayload = {
      sub: 1,
      jti: "session_id",
    };
    verifyTokenStub.resolves(jwtPayload);

    await AuthorisationMiddleware(req, res, next);

    expect(req.tokens).to.be.deep.equal({
      access: accessToken,
      refresh: refreshToken,
    });
  });

  it("should set req.tokens when access and refresh are in header", async () => {
    const accessToken = jwt.sign({ sub: 1 }, process.env.JWT_ACCESS_SECRET);
    const refreshToken = jwt.sign({ sub: 1 }, process.env.JWT_REFRESH_SECRET);

    req.setHeader("authorization", "Bearer " + accessToken);
    req.setHeader("refresh-token", refreshToken);

    const jwtPayload = {
      sub: 1,
      jti: "session_id",
    };
    verifyTokenStub.resolves(jwtPayload);

    await AuthorisationMiddleware(req, res, next);

    expect(req.tokens).to.be.deep.equal({
      access: accessToken,
      refresh: refreshToken,
    });
  });

  it("should set req.user", async () => {
    const accessToken = jwt.sign({ sub: 1 }, process.env.JWT_ACCESS_SECRET);
    req.cookies = {
      [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
    };

    const jwtPayload = {
      sub: 1,
      jti: "session_id",
    };
    verifyTokenStub.resolves(jwtPayload);

    await AuthorisationMiddleware(req, res, next);

    expect(req.user).to.be.equal(1);
  });

  it("should set req.officer", async () => {
    const accessToken = jwt.sign({ sub: 1 }, process.env.JWT_ACCESS_SECRET);
    req.cookies = {
      [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
    };

    const jwtPayload = {
      sub: 1,
      jti: "session_id",
      is_officer: true,
    };
    verifyTokenStub.resolves(jwtPayload);

    await AuthorisationMiddleware(req, res, next);

    expect(req.officer).to.be.true;
  });
});
