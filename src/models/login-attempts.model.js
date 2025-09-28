const BaseModel = require("./base.model");

/**
 * @extends {BaseModel<LoginAttemptsModel>}
 */
class LoginAttemptsModel extends BaseModel {
  static table = "login_attempts";
  static schema = `CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, attempts INTEGER, last_attempt_at DATE);`;

  user_id;
  attempts = 0;
  last_attempt_at;

  /**
   * @param {number} user_id
   */
  constructor(user_id) {
    super();

    this.user_id = user_id;
  }

  async failedLoginAttempt() {
    this.attempts++;
    this.last_attempt_at = new Date();
    await this.save();
    return this;
  }

  async resetAttempts() {
    this.attempts = 0;
    this.last_attempt_at = new Date();
    await this.save();
    return this;
  }
}

LoginAttemptsModel.initialize();

module.exports = LoginAttemptsModel;
