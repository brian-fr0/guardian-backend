const BaseModel = require("./base.model");

class AlertModel extends BaseModel {
  static table = "alerts";
  static schema =
    `CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, type TEXT, created_at DEFAULT current_date)`;

  title;
  description;
  type;
  created_at = null;

  /**
   * @param {string} title
   * @param {string} description
   * @param {string} type
   */
  constructor(title, description, type) {
    super();

    this.title = title;
    this.description = description;
    this.type = type;
  }
}

AlertModel.initialize();

module.exports = AlertModel;
