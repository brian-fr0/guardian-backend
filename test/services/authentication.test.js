require("dotenv").config();
const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

const authenticationService = require("../../src/services/authentication.service");
const BaseModel = require("../../src/models/base.model");
const { ACCESS_TOKEN_WINDOW_SECONDS } = require("../../src/constants/jwts");
const jwt = require("jsonwebtoken");
const UserModel = require("../../src/models/user.model");
const HttpError = require("../../src/utils/http-error");
const JwtModel = require("../../src/models/jwt.model");
const LoginAttemptsModel = require("../../src/models/login-attempts.model");

describe("AuthenticationService", function () {
  let modelSaveStub;
  let modelFindByStub;
  let modelFindByIdStub;
  let modelFindAllByStub;
  let modelDeleteStub;
  let userIsBlockedStub;

  before(() => {
    process.env.JWT_ACCESS_SECRET = "fakesecret";
    process.env.ACCOUNT_LOCK_ATTEMPTS = 5;
    process.env.ACCOUNT_LOCKOUT_SECONDS = 40;
  });

  beforeEach(() => {
    modelSaveStub = sinon
      .stub(BaseModel.prototype, "save")
      .callsFake(function () {
        return this;
      });
    modelFindByStub = sinon.stub(BaseModel, "findBy").returns({});
    modelFindByIdStub = sinon.stub(BaseModel, "findById").returns({});
    modelFindAllByStub = sinon.stub(BaseModel, "findAllBy").returns({});
    modelDeleteStub = sinon
      .stub(BaseModel.prototype, "delete")
      .callsFake(function () {
        return this;
      });
    userIsBlockedStub = sinon.stub(authenticationService, "userIsLoginBlocked");
    sinon.useFakeTimers();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("login", () => {
    it("should return user when login details are correct", async () => {
      const fakeUser = new UserModel("testing123", "", "testing123", 0);
      await fakeUser.hashPassword();
      fakeUser.id = 1;

      modelFindByStub.resolves(fakeUser);
      userIsBlockedStub.resolves(false);

      const user = await authenticationService.login({
        username: "testing123",
        password: "testing123",
      });

      expect(user).to.equal(fakeUser);
    });

    it("should throw for non-existing username", async () => {
      modelFindByStub.resolves(null);

      await expect(
        authenticationService.login({
          username: "wrongusername",
          password: "testing123",
        }),
      )
        .to.rejectedWith(HttpError)
        .then((error) => {
          expect(error.clientMessage).to.be.equal("Bad Login Request");
          expect(error.code).to.be.equal(400);
        });
    });

    it("should throw for invalid password", async () => {
      const fakeUser = new UserModel("testing123", "", "testing12", 0);
      await fakeUser.verifyPassword();

      modelFindByStub.resolves(fakeUser);
      userIsBlockedStub.resolves(false);

      const userDetails = {
        username: "testing123",
        password: "incorrectpassword",
      };

      await expect(authenticationService.login(userDetails))
        .to.rejectedWith(HttpError)
        .then((error) => {
          expect(error.clientMessage).to.be.equal("Bad Login Request");
          expect(error.code).to.be.equal(400);
        });
    });

    it("should throw if user is blocked", async () => {
      const fakeUser = new UserModel("testing123", "", "testing123", 0);
      await fakeUser.hashPassword();
      fakeUser.id = 1;

      modelFindByStub.resolves(fakeUser);
      userIsBlockedStub.resolves(true);

      const userDetails = {
        username: "testing123",
        password: "testing123",
      };

      await expect(authenticationService.login(userDetails))
        .to.rejectedWith(HttpError)
        .then((error) => {
          expect(error.clientMessage).to.be.equal("Bad Login Request");
          expect(error.code).to.be.equal(400);
        });
    });
  });

  describe("register", async () => {
    it("should save user when register details are valid", async () => {
      const userDetails = {
        username: "testing123",
        password: "testing123",
        first_name: "John",
        last_name: "Smith",
      };

      await authenticationService.register(userDetails);
    });

    it("should throw when password is too short", async () => {
      const userDetails = {
        username: "testing123",
        password: "testing",
      };

      await expect(authenticationService.register(userDetails)).to.rejected;
    });

    it("should throw when username already exists", async () => {
      const uniqueError = new Error("SQLITE_CONSTRAINT: UNIQUE");

      modelSaveStub.rejects(uniqueError);

      const userDetails = {
        username: "testing123",
        password: "testing123",
      };

      await expect(authenticationService.register(userDetails)).to.rejected;
    });
  });

  describe("getUserById", () => {
    it("should return user", async () => {
      const fakeUser = new UserModel("testing123", "", "testing123", 0);
      fakeUser.id = 1;
      modelFindByIdStub.resolves(fakeUser);

      const user = await authenticationService.getUserById(1);
      expect(user).to.be.instanceOf(UserModel);
    });

    it("should return null when no user found", async () => {
      modelFindByIdStub.resolves(null);

      const user = await authenticationService.getUserById(1);
      expect(user).to.be.equal(null);
    });
  });

  describe("generateTokens", () => {
    it("should generate valid access and refresh tokens", async () => {
      const tokens = await authenticationService.generateTokens(1, 0);

      expect(tokens).to.be.an("array").that.has.lengthOf(2);

      expect(tokens[0]).to.be.a("string");
      expect(tokens[1]).to.be.a("string");

      const accessDecoded = jwt.decode(tokens[0]);
      expect(accessDecoded.sub).to.equal(1);

      const refreshDecoded = jwt.decode(tokens[1]);
      expect(refreshDecoded.sub).to.equal(1);
    });

    it("return no tokens when userId is missing", async () => {
      const tokens = await authenticationService.generateTokens();

      expect(tokens).to.be.an("array").that.has.lengthOf(0);
    });
  });

  describe("saveToken", () => {
    it("should return jwt model", async () => {
      const token = jwt.sign({ sub: 1 }, "fakesecret");
      const fakeJwt = new JwtModel(1, "xxx-xxx", token, "access", 5000);
      modelSaveStub.resolves(fakeJwt);

      const jwtSaved = await authenticationService.saveToken(
        1,
        "xxx-xxx",
        token,
        "access",
        5000,
      );

      expect(jwtSaved).to.be.instanceOf(JwtModel);
      expect(jwtSaved.jwt).to.be.equal(token);
    });

    it("should return null when missing any arugment", async () => {
      const jwtSaved = await authenticationService.saveToken(1, 5000);

      expect(jwtSaved).to.be.null;
    });
  });

  describe("deleteTokensForUser", async () => {
    it("should delete all jwts", async () => {
      const fakeToken = jwt.sign({ sub: 1 }, "fakesecret");
      const fakeJwts = [
        new JwtModel(1, "xxx-xxx", fakeToken, "access", 5000),
        new JwtModel(1, "xxx-xxx", fakeToken, "refresh", 5000),
      ];
      modelFindAllByStub.resolves(fakeJwts);

      await authenticationService.deleteTokensForUser(1);

      expect(modelFindAllByStub).to.be.calledOnceWithExactly("user_id", 1);
      expect(modelDeleteStub).to.be.callCount(2);
    });

    it("should do nothing when no jwts exist", async () => {
      modelFindAllByStub.resolves([]);

      await authenticationService.deleteTokensForUser(1);

      expect(modelFindAllByStub).to.be.calledOnceWithExactly("user_id", 1);
      expect(modelDeleteStub).to.be.not.called;
    });

    it("should throw a error when no userId is provided", async () => {
      await expect(authenticationService.deleteTokenForUser())
        .to.rejectedWith(HttpError)
        .then((error) => {
          expect(error.clientMessage).to.be.equal("Bad Request");
          expect(error.code).to.be.equal(400);
        });
    });
  });

  describe("deleteTokenForUser", () => {
    it("should delete jwt that matches type queried", async () => {
      const fakeToken = jwt.sign({ sub: 1 }, "fakesecret");
      const fakeJwt = new JwtModel(1, "xxx-xxx", fakeToken, "access", 5000);

      modelFindByStub.resolves(fakeJwt);

      await authenticationService.deleteTokenForUser(1, "access");

      expect(modelFindByStub).to.be.calledOnceWithExactly(
        ["user_id", "type"],
        [1, "access"],
      );
      expect(modelDeleteStub).to.be.callCount(1);
    });

    it("should do nothing when no jwts exist", async () => {
      modelFindByStub.resolves(null);

      await authenticationService.deleteTokenForUser(1, "access");

      expect(modelFindByStub).to.be.calledOnceWithExactly(
        ["user_id", "type"],
        [1, "access"],
      );
      expect(modelDeleteStub).to.be.not.called;
    });

    it("should throw a error when no userId is provided", async () => {
      await expect(
        authenticationService.deleteTokenForUser(undefined, "access"),
      )
        .to.rejectedWith(HttpError)
        .then((error) => {
          expect(error.clientMessage).to.be.equal("Bad Request");
          expect(error.code).to.be.equal(400);
        });
    });

    it("should throw a error when no type is provided", async () => {
      await expect(authenticationService.deleteTokenForUser(1))
        .to.rejectedWith(HttpError)
        .then((error) => {
          expect(error.clientMessage).to.be.equal("Bad Request");
          expect(error.code).to.be.equal(400);
        });
    });
  });

  describe("verifyToken", () => {
    it("given a valid token, it should return it's payload", async function () {
      const [token] = await authenticationService.generateTokens(1, 0);

      const payload = await authenticationService.verifyToken(token);

      expect(payload.sub).to.be.equal(1);
    });

    it("given a invalid token, it should throw", async function () {
      const token = jwt.sign({ sub: 1 }, "incorrectfakesecret");
      await expect(authenticationService.verifyToken(token)).to.rejectedWith(
        jwt.JsonWebTokenError,
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh when given valid refresh and access token", async () => {
      const [access, refresh] = await authenticationService.generateTokens(
        1,
        0,
      );

      const newTokens = await authenticationService.refreshToken(
        access,
        refresh,
        { refreshTokenEnabledWindowSeconds: ACCESS_TOKEN_WINDOW_SECONDS },
      );

      expect(newTokens).to.be.an("array").that.has.lengthOf(2);

      expect(newTokens[0]).to.be.a("string");
      expect(newTokens[1]).to.be.a("string");

      expect(newTokens[0]).to.not.equal(access);
      expect(newTokens[1]).to.not.equal(refresh);

      const accessDecoded = jwt.decode(newTokens[0]);
      expect(accessDecoded.sub).to.equal(1);

      const refreshDecoded = jwt.decode(newTokens[1]);
      expect(refreshDecoded.sub).to.equal(1);
    });

    it("should refresh when given valid refresh token", async () => {
      const [, refresh] = await authenticationService.generateTokens(1, 0);

      const newTokens = await authenticationService.refreshToken(
        null,
        refresh,
        { refreshTokenEnabledWindowSeconds: ACCESS_TOKEN_WINDOW_SECONDS },
      );

      expect(newTokens).to.be.an("array").that.has.lengthOf(2);

      expect(newTokens[0]).to.be.a("string");
      expect(newTokens[1]).to.be.a("string");

      expect(newTokens[1]).to.not.equal(refresh);

      const accessDecoded = jwt.decode(newTokens[0]);
      expect(accessDecoded.sub).to.equal(1);

      const refreshDecoded = jwt.decode(newTokens[1]);
      expect(refreshDecoded.sub).to.equal(1);
    });

    it("should not refresh when given valid refresh token but a access token that is still valid", async () => {
      const [access, refresh] = await authenticationService.generateTokens(
        1,
        0,
      );

      const newTokens = await authenticationService.refreshToken(
        access,
        refresh,
      );

      expect(newTokens).to.be.an("array").that.has.lengthOf(0);
    });

    it("should not refresh when given invalid refresh token", async () => {
      const [access] = await authenticationService.generateTokens(1, 0);
      const refresh = jwt.sign({ sub: 1 }, "incorrectfakesecret");

      expect(
        async () =>
          await authenticationService.refreshToken(access, refresh, {
            refreshTokenEnabledWindowSeconds: ACCESS_TOKEN_WINDOW_SECONDS,
          }),
      ).to.throw;
    });
  });

  describe("logout", () => {
    it("should logout user with valid userId and access token", async () => {
      const token = jwt.sign(
        { sub: 1, jti: "xxx-xxx" },
        process.env.JWT_ACCESS_SECRET,
      );

      const jwtDeleteAllSessionTokensStub = sinon.stub(
        JwtModel,
        "deleteAllSessionTokens",
      );

      await authenticationService.logout(1, token);
      expect(jwtDeleteAllSessionTokensStub).to.be.calledOnceWithExactly(
        "xxx-xxx",
      );
    });

    it("should logout user of all sessions when no access token is provided", async () => {
      const jwtDeleteAllUserTokensStub = sinon.stub(
        JwtModel,
        "deleteAllUserTokens",
      );

      await authenticationService.logout(1);
      expect(jwtDeleteAllUserTokensStub).to.be.calledOnceWithExactly(1);
    });
  });

  describe("getProfile", () => {
    it("should return users profile", async () => {
      const fakeUser = new UserModel("testing123", "", "testing123", 0);
      modelFindByIdStub.resolves(fakeUser);

      const profile = await authenticationService.getProfile(1);

      expect(modelFindByIdStub).to.be.calledOnceWithExactly(1);
      expect(profile).to.be.instanceOf(UserModel);
      expect(profile.username).to.be.equal("testing123");
    });

    it("should return null when no profile is found", async () => {
      modelFindByIdStub.resolves(null);

      const profile = await authenticationService.getProfile(1);

      expect(modelFindByIdStub).to.be.calledOnceWithExactly(1);
      expect(profile).to.be.equal(null);
    });

    it("should return null when no id is given", async () => {
      modelFindByIdStub.resolves(null);

      const profile = await authenticationService.getProfile();

      expect(modelFindByIdStub).to.be.calledOnceWithExactly(undefined);
      expect(profile).to.be.equal(null);
    });

    it("should return null when id is null", async () => {
      modelFindByIdStub.resolves(null);

      const profile = await authenticationService.getProfile(null);

      expect(modelFindByIdStub).to.be.calledOnceWithExactly(null);
      expect(profile).to.be.equal(null);
    });
  });

  describe("failedLoginAttempt", () => {
    it("increases login attempts for connected account", async () => {
      const fakeLoginAttempts = new LoginAttemptsModel(1);
      fakeLoginAttempts.attempts = 2;

      modelFindByStub.resolves(fakeLoginAttempts);

      await authenticationService.failedLoginAttempt(1);

      expect(modelFindByStub).to.be.calledOnceWithExactly("user_id", 1);
      expect(fakeLoginAttempts.attempts).to.be.equal(3);
    });

    it("creates new login attempts entry for connected account when entry not found", async () => {
      modelFindByStub.resolves(null);

      const loginAttempts = await authenticationService.failedLoginAttempt(1);

      expect(modelFindByStub).to.be.calledOnceWithExactly("user_id", 1);
      expect(loginAttempts.attempts).to.be.equal(1);
    });

    it("throws error when no userId given", async () => {
      /** @type {HttpError} */
      let missingUserIdErr;

      try {
        await authenticationService.failedLoginAttempt();
      } catch (err) {
        missingUserIdErr = err;
      }

      expect(missingUserIdErr).to.be.instanceOf(HttpError);
      expect(missingUserIdErr.clientMessage).to.be.equal("Bad Request");
      expect(missingUserIdErr.code).to.be.equal(400);
    });
  });

  describe("userIsLoginBlocked", () => {
    it("login attempt model found, user is not blocked, returns false", async () => {
      const fakeLoginAttempts = new LoginAttemptsModel(1);

      userIsBlockedStub.restore();
      modelFindByStub.resolves(fakeLoginAttempts);

      const userIsBlocked = await authenticationService.userIsLoginBlocked(1);

      expect(modelFindByStub).to.be.calledOnceWithExactly("user_id", 1);
      expect(userIsBlocked).to.be.false;
    });

    it("login attempts model for user does not exist, so not blocked, returns false", async () => {
      userIsBlockedStub.restore();
      modelFindByStub.resolves(null);

      const userIsBlocked = await authenticationService.userIsLoginBlocked(1);

      expect(modelFindByStub).to.be.calledOnceWithExactly("user_id", 1);
      expect(userIsBlocked).to.be.false;
    });

    it("user was blocked, but timeout has expired, returns false", async () => {
      const fakeLoginAttempts = new LoginAttemptsModel(1);
      const date = new Date();
      date.setMinutes(date.getMinutes() - 1);
      fakeLoginAttempts.last_attempt_at = date;
      fakeLoginAttempts.attempts = 7;

      userIsBlockedStub.restore();
      modelFindByStub.resolves(fakeLoginAttempts);

      const userIsBlocked = await authenticationService.userIsLoginBlocked(1);

      expect(modelFindByStub).to.be.calledOnceWithExactly("user_id", 1);
      expect(userIsBlocked).to.be.false;
      expect(fakeLoginAttempts.attempts).to.be.equal(0);
    });

    it("user is blocked, returns true", async () => {
      const fakeLoginAttempts = new LoginAttemptsModel(1);
      const date = new Date();
      fakeLoginAttempts.last_attempt_at = date;
      fakeLoginAttempts.attempts = 7;

      userIsBlockedStub.restore();
      modelFindByStub.resolves(fakeLoginAttempts);

      const userIsBlocked = await authenticationService.userIsLoginBlocked(1);

      expect(modelFindByStub).to.be.calledOnceWithExactly("user_id", 1);
      expect(userIsBlocked).to.be.true;
      expect(fakeLoginAttempts.attempts).to.be.equal(7);
    });

    it("user id is null, returns false", async () => {
      userIsBlockedStub.restore();
      modelFindByStub.resolves(null);

      const userIsBlocked =
        await authenticationService.userIsLoginBlocked(null);

      expect(modelFindByStub).to.be.calledOnceWithExactly("user_id", -1);
      expect(userIsBlocked).to.be.false;
    });

    it("user id is undefined, returns false", async () => {
      userIsBlockedStub.restore();
      modelFindByStub.resolves(null);

      const userIsBlocked = await authenticationService.userIsLoginBlocked();

      expect(modelFindByStub).to.be.calledOnceWithExactly("user_id", -1);
      expect(userIsBlocked).to.be.false;
    });
  });
});
