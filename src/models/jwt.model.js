const argon2 = require("argon2");
const BaseModel = require("./base.model");

class JwtModel extends BaseModel {
  static table = "jwts";
  static schema = `CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, session_id TEXT, jwt TEXT UNIQUE, type TEXT, expires_at DATE, created_at DEFAULT current_date)`;

  user_id;
  session_id;
  jwt;
  type;
  expires_at;
  created_at = null;

  /**
   * @param {number} user_id
   * @param {string} jwt
   * @param {('access'|'refresh')} type
   * @param {number} expires_at
   */
  constructor(user_id, session_id, jwt, type, expires_at) {
    super();

    this.user_id = user_id;
    this.session_id = session_id;
    this.jwt = jwt;
    this.type = type;
    this.expires_at = expires_at;
  }

  async hashJwt() {
    this.jwt = await argon2.hash(this.jwt);
  }

  async verifyJwt(jwt) {
    try {
      return await argon2.verify(this.jwt, jwt);
    } catch {
      return false;
    }
  }

  async save() {
    await this.hashJwt();
    return await super.save();
  }

  static async deleteAllUserTokens(userId) {
    return await this.deleteWhere("user_id", userId);
  }

  static async deleteAllSessionTokens(sessionId) {
    return await this.deleteWhere("session_id", sessionId);
  }
}

JwtModel.initialize();

module.exports = JwtModel;
