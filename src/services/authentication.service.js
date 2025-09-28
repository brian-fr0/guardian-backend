const z = require("zod");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const { v4: uuidv4 } = require("uuid");
const UserModel = require("../models/user.model");
const HttpError = require("../utils/http-error");
const JwtModel = require("../models/jwt.model");
const LoginAttemptsModel = require("../models/login-attempts.model");
const {
  ACCESS_TOKEN_WINDOW_SECONDS,
  REFRESH_TOKEN_WINDOW_SECONDS,
  REFRESH_TOKEN_ENABLED_WINDOW_SECONDS,
} = require("../constants/jwts");
const AppError = require("../utils/app-error");
const mfaService = require("./mfa.service");

// 🔑 new secret helper
const { getSecret } = require("../lib/secrets");

const UserLogin = z.object({
  username: z.string(),
  password: z.string(),
});

const UserRegister = z.object({
  username: z.string().min(5),
  password: z.string().min(8),
  email: z.string().optional(),
  first_name: z.string(),
  last_name: z.string(),
});

class AuthenticationService {
  /**
   * @returns {Promise<UserModel | null>}
   */
  async login(loginDetails) {
    const validated = UserLogin.parse(loginDetails);

    /** @type {UserModel|null} */
    const user = await UserModel.findBy("username", validated.username);

    const validPassword = !user
      ? await argon2.verify(process.env.DUMMY_HASH, validated.password)
      : await user.verifyPassword(validated.password);
    const blocked = await this.userIsLoginBlocked(!user ? null : user.id);

    if (!user || !validPassword || blocked) {
      if (user) {
        this.failedLoginAttempt(user.id);
      }
      throw new HttpError({ code: 400, clientMessage: "Bad Login Request" });
    }

    await this.updateLastSeen(user.id);

    if (!user.mfa_required) {
      const mfaRequired = mfaService.doesLoginRequireMfa(user);
      user.mfa_required = mfaRequired;
      await user.save();
    }

    return user;
  }

  async register(registerDetails) {
    const validatdRegisterDetails = UserRegister.parse(registerDetails);
    const user = new UserModel(
      validatdRegisterDetails.username,
      validatdRegisterDetails.email,
      validatdRegisterDetails.password,
      validatdRegisterDetails.first_name,
      validatdRegisterDetails.last_name,
      false,
    );

    await user.save();
  }

  /**
   * @param {number} id
   * @returns {Promise<UserModel | null>}
   */
  async getUserById(id) {
    const user = await UserModel.findById(id);
    return user;
  }

  /**
   * @param {number} userId
   * @returns {Promise<[string, string]>}
   */
  async generateTokens(userId, is_officer = 0) {
    if (!userId) {
      return [];
    }

    const accessExp =
      Math.floor(Date.now() / 1000) + ACCESS_TOKEN_WINDOW_SECONDS;
    const refreshExp =
      Math.floor(Date.now() / 1000) + REFRESH_TOKEN_WINDOW_SECONDS;

    const session_id = uuidv4();

    // 🔑 use getSecret instead of process.env
    const accessSecret = await getSecret("JWT_ACCESS_SECRET");
    const refreshSecret = await getSecret("JWT_REFRESH_SECRET");

    const access = jwt.sign(
      {
        sub: userId,
        jti: session_id,
        is_officer,
        exp: accessExp,
      },
      accessSecret,
    );
    const refresh = jwt.sign(
      { sub: userId, jti: session_id, is_officer, exp: refreshExp },
      refreshSecret,
    );

    await this.saveToken(
      userId,
      session_id,
      access,
      "access",
      new Date(accessExp * 1000),
    );
    await this.saveToken(
      userId,
      session_id,
      refresh,
      "refresh",
      new Date(refreshExp * 1000),
    );

    return [access, refresh];
  }

  /**
   * @param {number} user_id
   * @param {string} token
   * @param {('access'|'refresh')} type
   * @param {number} expires_at
   * @returns {Promise<JwtModel>}
   */
  async saveToken(user_id, session_id, token, type, expires_at) {
    if (!user_id || !session_id || !token || !type || !expires_at) {
      return null;
    }

    return await new JwtModel(
      user_id,
      session_id,
      token,
      type,
      new Date(expires_at * 1000),
    ).save();
  }

  async deleteTokensForUser(user_id) {
    if (!user_id) {
      throw new HttpError({ code: 400, clientMessage: "Bad Request" });
    }

    const jwts = await JwtModel.findAllBy("user_id", user_id);
    if (jwts) {
      jwts.forEach(async (token) => {
        await token.delete();
      });
    }
  }

  async deleteTokenForUser(user_id, type) {
    if (!user_id || !type) {
      throw new HttpError({ code: 400, clientMessage: "Bad Request" });
    }

    const jwt = await JwtModel.findBy(["user_id", "type"], [user_id, type]);

    if (jwt) {
      await jwt.delete();
    }
  }

  async verifyToken(token, type = "access") {
    const accessSecret = await getSecret("JWT_ACCESS_SECRET");
    const refreshSecret = await getSecret("JWT_REFRESH_SECRET");

    const payload = jwt.verify(
      token,
      type == "refresh" ? refreshSecret : accessSecret,
    );

    const jwtSaved = await JwtModel.findBy("session_id", payload.jti);

    if (!jwtSaved) {
      throw new HttpError({ code: 401, clientMessage: "Invalid Token" });
    }

    return payload;
  }

  async refreshToken(
    access,
    refresh,
    {
      refreshTokenEnabledWindowSeconds = REFRESH_TOKEN_ENABLED_WINDOW_SECONDS,
    } = {},
  ) {
    let accessExpiresAt = null;
    try {
      const accessTokenVerified = await this.verifyToken(access, "access");
      accessExpiresAt = accessTokenVerified.exp;
    } catch {}

    if (
      accessExpiresAt !== null &&
      accessExpiresAt - Math.floor(Date.now() / 1000) >
        refreshTokenEnabledWindowSeconds
    ) {
      return [];
    }

    const refreshTokenVerified = await this.verifyToken(refresh, "refresh");

    const userId = refreshTokenVerified.sub;
    const isOfficer = refreshTokenVerified.is_officer;
    const sessionId = refreshTokenVerified.jti;

    setTimeout(() => {
      AppError.try(async () => {
        await JwtModel.deleteAllSessionTokens(sessionId);
      });
    }, 5000);

    return await this.generateTokens(userId, isOfficer);
  }

  async logout(userId, token, type) {
    if (userId && !token) {
      return await JwtModel.deleteAllUserTokens(userId);
    }

    const tokenValidted = await this.verifyToken(token, type);

    const sessionId = tokenValidted.jti;

    return await JwtModel.deleteAllSessionTokens(sessionId);
  }

  async getProfile(id) {
    const userDetails = await UserModel.findById(id);
    return userDetails;
  }

  async failedLoginAttempt(user_id) {
    if (!user_id) {
      throw new HttpError({ code: 400, clientMessage: "Bad Request" });
    }

    /** @type {LoginAttemptsModel | null} */
    const loginAttempt =
      (await LoginAttemptsModel.findBy("user_id", user_id)) ||
      (await new LoginAttemptsModel(user_id).save());

    await loginAttempt.failedLoginAttempt();
    return loginAttempt;
  }

  async userIsLoginBlocked(user_id) {
    /** @type {LoginAttemptsModel | null} */
    if (!user_id) {
      await LoginAttemptsModel.findBy("user_id", -1);
      return false;
    }

    const loginAttempts = await LoginAttemptsModel.findBy("user_id", user_id);

    if (!loginAttempts) {
      return false;
    }

    if (
      Date.now() - loginAttempts.last_attempt_at >
      process.env.ACCOUNT_LOCKOUT_SECONDS * 1000
    ) {
      await loginAttempts.resetAttempts();
      return false;
    }

    return loginAttempts.attempts >= process.env.ACCOUNT_LOCK_ATTEMPTS;
  }

  async updateLastSeen(id) {
    /** @type {UserModel} */
    await UserModel.runRaw(
      "UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?",
      id,
    );
  }

  async mfaVerified(id) {
    /** @type {UserModel} */
    const user = await UserModel.findById(id);

    if (!user) {
      return null;
    }

    user.mfa_required = 0;
    await user.save();
    return user;
  }
}

const authenticationService = new AuthenticationService();

module.exports = authenticationService;
