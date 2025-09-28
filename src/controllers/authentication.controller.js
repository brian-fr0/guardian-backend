const mfaService = require("src/services/mfa.service");
const cookieOptions = require("../config/cookie-options");
const {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} = require("../constants/cookies");
const authenticationService = require("../services/authentication.service");
const HttpError = require("../utils/http-error");
const HttpResponse = require("../utils/http-response-helper");
const getJwtFromRequest = require("../utils/jwts");

class AuthenticationController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async login(req, res) {
    const user = await authenticationService.login(req.body);

    if (!user) {
      return new HttpResponse(400, {}, "").json(res);
    }

    if (user.mfa_required) {
      const token = await mfaService.generateToken(user.id, user.email);
      return new HttpResponse(
        200,
        {
          mfa_token: token,
        },
        "mfa_required",
      ).json(res);
    }

    const [access, refresh] = await authenticationService.generateTokens(
      user.id,
      user.is_officer,
    );

    res
      .cookie(ACCESS_TOKEN_COOKIE_NAME, access, cookieOptions)
      .cookie(REFRESH_TOKEN_COOKIE_NAME, refresh, cookieOptions);

    new HttpResponse(200, {
      accessToken: access,
      refreshToken: refresh,
    }).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async register(req, res) {
    await authenticationService.register(req.body);

    new HttpResponse(200, {}, "").json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async logout(req, res) {
    const { access, refresh } = getJwtFromRequest(req, "all");

    if (!access && !refresh) {
      throw new HttpError({ code: 401 });
    }

    await authenticationService.logout(
      req.user,
      access || refresh,
      access ? "access" : "refresh",
    );
    res
      .clearCookie(ACCESS_TOKEN_COOKIE_NAME)
      .clearCookie(REFRESH_TOKEN_COOKIE_NAME);
    new HttpResponse(204).sendStatus(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async logoutAllSessions(req, res) {
    await authenticationService.logout(req.user);
    res
      .clearCookie(ACCESS_TOKEN_COOKIE_NAME)
      .clearCookie(REFRESH_TOKEN_COOKIE_NAME);
    new HttpResponse(204).sendStatus(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async refreshToken(req, res) {
    const { access, refresh } = getJwtFromRequest(req, "all");
    if (!refresh) {
      throw new HttpError({ code: 400 });
    }

    const tokens = await authenticationService.refreshToken(access, refresh);
    if (tokens.length === 0) {
      throw new HttpError({
        code: 400,
        clientMessage:
          "Token is not yet eligible for refresh. Retry closer to expiry.",
      });
    }

    const [accessToken, refreshToken] = tokens;

    res
      .cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, cookieOptions)
      .cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieOptions);

    new HttpResponse(200, {
      accessToken,
      refreshToken,
    }).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async isAuthed(req, res) {
    if (req.user) {
      return new HttpResponse(204).sendStatus(res);
    }

    throw new HttpError({ code: 401 });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async profile(req, res) {
    const user = await authenticationService.getProfile(req.user);

    if (!user) {
      throw new HttpError({ code: 404 });
    }

    new HttpResponse(200, user).json(res);
  }
}

const authenticationController = new AuthenticationController();

module.exports = authenticationController;
