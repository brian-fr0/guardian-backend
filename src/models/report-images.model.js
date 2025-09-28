const BaseModel = require("./base.model");

class ReportImagesModel extends BaseModel {
  static table = "report_images";
  static schema = `CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER, image_path TEXT, created_at DATE DEFAULT current_date)`;

  report_id;
  image_path;
  created_at = null;

  constructor(reportId, imagePath) {
    super();

    this.report_id = reportId;
    this.image_path = imagePath;
  }
}

ReportImagesModel.initialize();

module.exports = ReportImagesModel;
