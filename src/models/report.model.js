const BaseModel = require("./base.model");

class ReportModel extends BaseModel {
  static table = "reports";
  static schema = `CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT, longitude REAL, latitude REAL, user_id INTEGER, status TEXT DEFAULT "PENDING", priority INTEGER, createdAt DATE DEFAULT current_date)`;

  description;
  longitude;
  latitude;
  user_id;
  status;
  priority;
  createdAt = null;

  constructor(description, longitude, latitude, user_id, priority = 20) {
    super();

    this.description = description;
    this.longitude = longitude;
    this.latitude = latitude;
    this.user_id = user_id;
    this.priority = priority;
  }
}

ReportModel.initialize();

module.exports = ReportModel;
