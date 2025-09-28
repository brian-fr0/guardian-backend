const chai = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const authenticationController = require("../../src/controllers/authentication.controller");
const ExpressMockRequest = require("../testing-utils/expressRequest");
const ExpressMockResponse = require("../testing-utils/expressResponse");
const setupBaseModelStubs = require("../testing-utils/baseModelMocks");
const UserModel = require("../../src/models/user.model");
const HttpError = require("../../src/utils/http-error");
const { default: z } = require("zod");
const JwtModel = require("../../src/models/jwt.model");

const {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} = require("../../src/constants/cookies");
const {
  REFRESH_TOKEN_ENABLED_WINDOW_SECONDS,
  REFRESH_TOKEN_WINDOW_SECONDS,
  ACCESS_TOKEN_WINDOW_SECONDS,
} = require("../../src/constants/jwts");

const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("AuthenticationController", () => {
  /** @type {import("../testing-utils/expressRequest").RequestMock} */
  let req;
  /** @type {import("../testing-utils/expressResponse").ResponseMock} */
  let res;
  /** @type {import("../testing-utils/baseModelMocks").BaseModelStubs} */
  let baseModelStubs;
  let clock;

  before(() => {
    process.env.JWT_ACCESS_SECRET = "fakeAccessSecret";
    process.env.JWT_REFRESH_SECRET = "fakeRefreshSecret";
    process.env.ACCOUNT_LOCK_ATTEMPTS = 5;
    process.env.ACCOUNT_LOCKOUT_SECONDS = 40;
    process.env.DUMMY_HASH =
      "$argon2id$v=19$m=65536,t=3,p=4$GMnXvL6ie0Lg9wL9fyJLvA$6Oj1mhGilcj5KFzEmN7a+udr5Atx/9al8lq6pxHDNWc";
  });

  beforeEach(() => {
    baseModelStubs = setupBaseModelStubs();

    req = ExpressMockRequest.new();
    res = ExpressMockResponse.new();

    req.res = res;
    res.req = req;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    sinon.restore();
    req = null;
    res = null;
  });

  describe("login", () => {
    it("should respond with 200 when credentials are valid", async () => {
      req.body = {
        username: "example",
        password: "example123",
      };

      const fakeUser = new UserModel(
        "example",
        "",
        "example123",
        "john",
        "smith",
        0,
      );
      await fakeUser.hashPassword();

      baseModelStubs.findBy.resolves(fakeUser);

      await authenticationController.login(req, res);

      expect(res.statusCode).to.be.equal(200);
    });

    it("should set access and refresh tokens cookies", async () => {
      req.body = {
        username: "example",
        password: "example123",
      };

      const fakeUser = new UserModel("example", "", "example123", 0);
      await fakeUser.hashPassword();

      baseModelStubs.findBy.resolves(fakeUser);

      await authenticationController.login(req, res);

      expect(res.get("Set-Cookie")).to.be.an("array");
      expect(res.get("Set-Cookie")).to.be.length(2);

      expect(res.get("Set-Cookie")[0]).to.include("access");
      expect(res.get("Set-Cookie")[1]).to.include("refresh");
    });

    it("should throw http error when password incorrect", async () => {
      req.body = {
        username: "example",
        password: "wrongpassword123",
      };

      const fakeUser = new UserModel("example", "", "example123", 0);
      await fakeUser.hashPassword();

      baseModelStubs.findBy.resolves(fakeUser);

      await expect(authenticationController.login(req, res))
        .to.be.rejectedWith(HttpError)
        .then((error) => {
          expect(error.code).to.be.equal(400);
        });
    });

    it("should throw http error when user does not exist", async () => {
      req.body = {
        username: "wronguser123",
        password: "example123",
      };

      baseModelStubs.findBy.resolves(null);

      await expect(authenticationController.login(req, res))
        .to.be.rejectedWith(HttpError)
        .then((error) => {
          expect(error.code).to.be.equal(400);
        });
    });
  });

  describe("register", () => {
    it("respond with 200 when register details are valid", async () => {
      req.body = {
        username: "example",
        password: "example123",
        first_name: "John",
        last_name: "Smith",
      };

      await authenticationController.register(req, res);

      expect(res.statusCode).to.be.equal(200);
    });

    it("should throw when user exists", async () => {
      req.body = {
        username: "example",
        password: "example123",
        first_name: "John",
        last_name: "Smith",
      };

      baseModelStubs.save.rejects(new Error("SQLITE_CONSTRAINT: UNIQUE"));

      await expect(authenticationController.register(req, res))
        .to.be.rejectedWith(Error)
        .then((error) => {
          expect(error.message).to.be.equal("SQLITE_CONSTRAINT: UNIQUE");
        });
    });

    it("should throw zod error when password too short", async () => {
      req.body = {
        username: "example",
        password: "example",
        first_name: "John",
        last_name: "Smith",
      };

      await expect(
        authenticationController.register(req, res),
      ).to.be.rejectedWith(z.ZodError);
    });
  });

  describe("logout", () => {
    it("should respond with 204 when user can be logged out", async () => {
      const accessToken = jwt.sign(
        { sub: 1, jti: "xx" },
        process.env.JWT_ACCESS_SECRET,
      );

      baseModelStubs.findBy.resolves(accessToken);

      req.cookies = {
        [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
      };

      await authenticationController.logout(req, res);

      expect(res.statusCode).to.be.equal(204);
    });

    it("should respond with 204 when user can be logged out with only refresh token", async () => {
      const refreshToken = jwt.sign(
        { sub: 1, jti: "xx" },
        process.env.JWT_REFRESH_SECRET,
      );

      baseModelStubs.findBy.resolves(refreshToken);

      req.cookies = {
        [REFRESH_TOKEN_COOKIE_NAME]: refreshToken,
      };

      const jwtDeleteSessionSpy = sinon.spy(JwtModel, "deleteAllUserTokens");
      await authenticationController.logout(req, res);

      sinon.assert.notCalled(jwtDeleteSessionSpy);
      expect(res.statusCode, 204).to.be.equal(204);
    });

    it("should clear token cookies", async () => {
      const accessToken = jwt.sign(
        { sub: 1, jti: "xx" },
        process.env.JWT_ACCESS_SECRET,
      );

      baseModelStubs.findBy.resolves(accessToken);

      req.cookies = {
        [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
      };

      await authenticationController.logout(req, res);

      const setCookieHeader = res.get("Set-Cookie");

      expect(setCookieHeader).to.be.an("array");
      expect(setCookieHeader[0]).to.include("accessToken=;");
    });

    it("should invalidate session", async () => {
      const accessToken = jwt.sign(
        { sub: 1, jti: "session-id-xxx1" },
        process.env.JWT_ACCESS_SECRET,
      );

      baseModelStubs.findBy.resolves(accessToken);

      req.cookies = {
        [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
      };

      const jwtDeleteSessionSpy = sinon.spy(JwtModel, "deleteAllSessionTokens");

      await authenticationController.logout(req, res);

      expect(jwtDeleteSessionSpy).to.be.calledWithExactly("session-id-xxx1");
    });

    it("should throw 401 http error if access and refresh tokens missing", async () => {
      await expect(authenticationController.logout(req, res))
        .to.be.rejectedWith(HttpError)
        .then((error) => {
          expect(error.code).to.be.equal(401);
        });
    });
  });

  describe("logoutAllSessions", () => {
    it("should respond with 204 when user can be logged out from all sessions", async () => {
      req.user = 1;

      await authenticationController.logoutAllSessions(req, res);

      expect(res.statusCode, 204).to.be.equal(204);
    });

    it("should clear token cookies", async () => {
      const accessToken = jwt.sign(
        { sub: 1, jti: "xx" },
        process.env.JWT_ACCESS_SECRET,
      );

      baseModelStubs.findBy.resolves(accessToken);

      req.user = 1;
      req.cookies = {
        [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
      };

      await authenticationController.logoutAllSessions(req, res);

      const setCookieHeader = res.get("Set-Cookie");

      expect(setCookieHeader).to.be.an("array");
      expect(setCookieHeader[0]).to.include("accessToken=;");
    });

    it("should invalidate all sessions", async () => {
      const jwtDeleteSessionSpy = sinon.spy(JwtModel, "deleteAllUserTokens");

      req.user = 1;

      await authenticationController.logoutAllSessions(req, res);

      sinon.assert.calledOnceWithExactly(jwtDeleteSessionSpy, 1);
    });

    it("should throw an error if user id is missing", async () => {
      /** @type {HttpError} */
      await expect(authenticationController.logoutAllSessions(req, res)).to.be
        .rejected;
    });
  });

  describe("refreshToken", () => {
    it("should respond with 200 when tokens can be refreshed", async () => {
      const accessToken = jwt.sign(
        {
          sub: 1,
          jti: "xx",
          exp:
            Math.floor(Date.now() / 1000) +
            REFRESH_TOKEN_ENABLED_WINDOW_SECONDS -
            10,
        },
        process.env.JWT_ACCESS_SECRET,
      );
      const refreshToken = jwt.sign(
        {
          sub: 1,
          jti: "xx",
          exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_WINDOW_SECONDS,
        },
        process.env.JWT_REFRESH_SECRET,
      );

      baseModelStubs.findBy.onFirstCall().resolves(accessToken);
      baseModelStubs.findBy.onSecondCall().resolves(refreshToken);

      req.cookies = {
        [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
        [REFRESH_TOKEN_COOKIE_NAME]: refreshToken,
      };

      await authenticationController.refreshToken(req, res);

      expect(res.statusCode).to.be.equal(200);
    });

    it("should send tokens as json payload", async () => {
      const accessToken = jwt.sign(
        {
          sub: 1,
          jti: "xx",
          exp:
            Math.floor(Date.now() / 1000) +
            REFRESH_TOKEN_ENABLED_WINDOW_SECONDS -
            10,
        },
        process.env.JWT_ACCESS_SECRET,
      );
      const refreshToken = jwt.sign(
        {
          sub: 1,
          jti: "xx",
          exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_WINDOW_SECONDS,
        },
        process.env.JWT_REFRESH_SECRET,
      );

      baseModelStubs.findBy.onFirstCall().resolves(accessToken);
      baseModelStubs.findBy.onSecondCall().resolves(refreshToken);

      req.cookies = {
        [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
        [REFRESH_TOKEN_COOKIE_NAME]: refreshToken,
      };

      await authenticationController.refreshToken(req, res);

      const bodyData = ExpressMockResponse.getResponseJsonBody(res);

      expect(bodyData.data).to.have.property("accessToken");
      expect(bodyData.data).to.have.property("refreshToken");
    });

    it("should set cookies for tokens", async () => {
      const accessToken = jwt.sign(
        {
          sub: 1,
          jti: "xx",
          exp:
            Math.floor(Date.now() / 1000) +
            REFRESH_TOKEN_ENABLED_WINDOW_SECONDS -
            10,
        },
        process.env.JWT_ACCESS_SECRET,
      );
      const refreshToken = jwt.sign(
        {
          sub: 1,
          jti: "xx",
          exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_WINDOW_SECONDS,
        },
        process.env.JWT_REFRESH_SECRET,
      );

      baseModelStubs.findBy.onFirstCall().resolves(accessToken);
      baseModelStubs.findBy.onSecondCall().resolves(refreshToken);

      req.cookies = {
        [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
        [REFRESH_TOKEN_COOKIE_NAME]: refreshToken,
      };

      await authenticationController.refreshToken(req, res);

      expect(res.get("Set-Cookie")).to.be.not.undefined;
    });

    it("should throw 400 http error if attempting to refresh too soon", async () => {
      const accessToken = jwt.sign(
        {
          sub: 1,
          jti: "xx",
          exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_WINDOW_SECONDS,
        },
        process.env.JWT_ACCESS_SECRET,
      );
      const refreshToken = jwt.sign(
        {
          sub: 1,
          jti: "xx",
          exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_WINDOW_SECONDS,
        },
        process.env.JWT_REFRESH_SECRET,
      );

      baseModelStubs.findBy.onFirstCall().resolves(accessToken);
      baseModelStubs.findBy.onSecondCall().resolves(refreshToken);

      req.cookies = {
        [ACCESS_TOKEN_COOKIE_NAME]: accessToken,
        [REFRESH_TOKEN_COOKIE_NAME]: refreshToken,
      };

      await expect(authenticationController.refreshToken(req, res))
        .to.be.rejectedWith(HttpError)
        .then((error) => {
          expect(error.code).to.be.equal(400);
        });
    });

    it("should throw 400 http error if refresh token missing", async () => {
      await expect(authenticationController.refreshToken(req, res))
        .to.be.rejectedWith(HttpError)
        .then((error) => {
          expect(error.code).to.be.equal(400);
        });
    });
  });

  describe("isAuthed", () => {
    it("should respond with 204 when user is authenticated", async () => {
      req.user = 1;

      await authenticationController.isAuthed(req, res);

      expect(res.statusCode).to.be.equal(204);
    });

    it("should throw 401 http error when user is not authenticated", async () => {
      await expect(authenticationController.isAuthed(req, res))
        .to.be.rejectedWith(HttpError)
        .then((error) => {
          expect(error.code).to.be.equal(401);
        });
    });
  });

  describe("profile", () => {
    it("should respond with 200 when found profile", async () => {
      const fakeProfile = new UserModel("example", "", "example123", 0);
      baseModelStubs.findById.resolves(fakeProfile);

      req.id = 1;

      await authenticationController.profile(req, res);

      expect(res.statusCode).to.be.equal(200);
    });

    it("should send profile as json payload", async () => {
      const fakeProfile = new UserModel("example", "", "example123", 0);
      baseModelStubs.findById.resolves(fakeProfile);

      req.id = 1;

      await authenticationController.profile(req, res);

      const body = ExpressMockResponse.getResponseJsonBody(res);

      expect(body.data).to.have.property("username");
      expect(body.data.username).to.be.equal("example");
    });

    it("should throw 404 http error if profile is not found", async () => {
      baseModelStubs.findById.resolves(null);

      req.id = 2;

      await expect(authenticationController.profile(req, res))
        .to.be.rejectedWith(HttpError)
        .then((error) => {
          expect(error.code).to.be.equal(404);
        });
    });

    it("should throw error if user id is missing", async () => {
      await expect(authenticationController.profile(req, res)).to.be.rejected;
    });
  });
});
