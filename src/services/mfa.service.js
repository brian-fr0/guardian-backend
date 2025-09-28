console.log(process.env.NODE_PATH);
const {
  MFA_CUTOFF_TIMESTAMP,
  MFA_ACCESS_TOKEN_WINDOW_SECONDS,
  MFA_RESEND_ALLOW_AFTER_MS,
} = require("src/constants/mfa");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { randomInt } = require("node:crypto");
const argon2 = require("argon2");
const HttpError = require("src/utils/http-error");
const mailTransporter = require("src/config/nodemailer.config");

const lastSent = {};

class MFAService {
  /**
   * @param {UserModel} user
   */
  doesLoginRequireMfa(user) {
    if (!user) {
      return false;
    }

    if (!user.email || user.email === "") {
      return false;
    }

    const lastSeenMs = new Date(`${user.last_seen_at} UTC`).getTime();

    return lastSeenMs < MFA_CUTOFF_TIMESTAMP();
  }

  /**
   * @returns {string}
   */
  generateCode() {
    return randomInt(100000, 999999 + 1).toString();
  }

  /**
   * @param {number} userId
   * @param {string} email
   * @param {number|null} [existingExp=null]
   * @returns {string}
   */
  async generateToken(userId, email, existingExp = null) {
    if (!userId || !email || email === "") return null;
    const now = Date.now();

    if (
      lastSent[userId] &&
      now < lastSent[userId] + MFA_RESEND_ALLOW_AFTER_MS
    ) {
      throw new HttpError({
        code: 400,
        clientMessage: "Requesting codes too quickly",
      });
    }

    const exp =
      existingExp ||
      Math.floor(Date.now() / 1000) + MFA_ACCESS_TOKEN_WINDOW_SECONDS;
    const sessionId = uuidv4();
    const code = this.generateCode();
    const hashedCode = await argon2.hash(code);

    const token = jwt.sign(
      { sub: userId, jti: sessionId, exp, code: hashedCode, email },
      process.env.JWT_MFA_SECRET,
    );

    await mailTransporter.sendMail({
      to: email,
      subject: "Guardian 2FA Code",
      html: `<h1>${code}</h1>`,
    });

    lastSent[userId] = now;

    return token;
  }

  /**
   * @param {sring} token
   * @returns {jwt.JwtPayload}
   */
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_MFA_SECRET);
  }

  /**
   * @param {string} token
   * @param {string} code
   */
  async verifyCode(token, code) {
    const payload = this.verifyToken(token);
    const codeValid = await argon2.verify(payload.code, code);

    if (!codeValid) {
      throw new HttpError({ code: 400, clientMessage: "Invalid 2FA Code" });
    }

    return payload;
  }
}

const mfaService = new MFAService();

module.exports = mfaService;
