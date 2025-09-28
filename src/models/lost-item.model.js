const BaseModel = require("./base.model");

class LostItemModel extends BaseModel {
  static table = "lost_items";
  static schema =
    `CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, serial_number TEXT, color TEXT, model TEXT, latitude INTEGER, longitude INTEGER, status TEXT, branch TEXT, user_id INTEGER, created_at DATE DEFAULT current_date)`;

  name;
  description;
  serial_number;
  color;
  model;
  latitude;
  longitude;
  status;
  branch;
  user_id;
  created_at = null;

  constructor(
    name,
    description,
    serialNumber,
    color,
    model,
    longitude,
    latitude,
    status,
    branch,
    user_id,
  ) {
    super();

    this.name = name;
    this.description = description;
    this.serial_number = serialNumber;
    this.color = color;
    this.model = model;
    this.longitude = longitude;
    this.latitude = latitude;
    this.status = status;
    this.branch = branch;
    this.user_id = user_id;
  }
}

LostItemModel.initialize();

module.exports = LostItemModel;
