const BaseModel = require("./base.model");

class TwoFactorCodesModel extends BaseModel {
  static table = "two_factor_auth_codes";
  static schema = `CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, code TEXT, expires_at TEXT, created_at DATE DEFAULT current_date)`;


  user_id;
  code;
  expires_at;
  created_at = null;

  constructor(user_id, code, expiresAt) {
    super();

    this.user_id = user_id;
    this.code = code;
    this.expires_at = expiresAt;
  }

}

TwoFactorCodesModel.initialize();

module.exports = TwoFactorCodesModel;
