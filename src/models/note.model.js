const BaseModel = require("./base.model");

class NoteModel extends BaseModel {
  static table = "notes";
  static schema =
    `CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, subject TEXT, content TEXT, resource_id INTEGER, resource_type INTEGER, created_at DEFAULT current_date)`;

  subject;
  content;
  resource_id;
  resource_type;
  created_at = null;

  /**
   * @param {string} subject
   * @param {string} content
   * @param {number} resource_id
   * @param {('report'|'lost_article')} resource_type
   */
  constructor(subject, content, resource_id, resource_type) {
    super();

    this.subject = subject;
    this.content = content;
    this.resource_id = resource_id;
    this.resource_type = resource_type;
  }
}

NoteModel.initialize();

module.exports = NoteModel;
