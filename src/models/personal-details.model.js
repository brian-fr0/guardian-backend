const BaseModel = require("./base.model");

class PersonalDetailsModel extends BaseModel {
  static table = "personal_details";
  static schema = `
    CREATE TABLE IF NOT EXISTS ${this.table} 
    (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT, last_name TEXT, date_of_birth DATE, contact_number TEXT, report_id INTEGER, lost_article_id INTEGER,  created_at DATE DEFAULT current_date)
  `;

  first_name;
  last_name;
  date_of_birth;
  contact_number;
  report_id;
  lost_article_id;
  created_at;

  constructor(firstName, lastName, dateOfBirth, contactNumber) {
    super();

    this.first_name = firstName;
    this.last_name = lastName;
    this.date_of_birth = dateOfBirth;
    this.contact_number = contactNumber;
  }

  attachToReport(report_id) {
    this.report_id = report_id;
  }

  attachToLostArticle(lost_article_id) {
    this.lost_article_id = lost_article_id;
  }
}

PersonalDetailsModel.initialize();

module.exports = PersonalDetailsModel;
