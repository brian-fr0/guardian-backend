const AlertModel = require("src/models/alert.model");
const HttpError = require("src/utils/http-error");
const z = require("zod");

class AlertsService {
  alertValidation = z.object({
    title: z.string(),
    description: z.string(),
    type: z.string(),
  });

  /**
   * @param {number} [limit=20]
   * @param {number} [page=0]
   * @returns {Promise<AlertModel[]>}
   */
  async all(limit = 20, page = 0) {
    return await AlertModel.all({ limit, page });
  }

  /**
   * @param {{ title: string; description: string; type: string; }} body
   * @returns {Promise<AlertModel>}
   */
  async create(body) {
    const alertBody = this.alertValidation.parse(body);

    return await new AlertModel(
      alertBody.title,
      alertBody.description,
      alertBody.type,
    ).save();
  }

  /**
   * @param {number} id
   * @returns {Promise<AlertModel>}
   */
  async getById(id) {
    if (!id || Number.isNaN(id)) {
      throw new HttpError({
        code: 400,
        clientMessage: "Alert ID must be included",
      });
    }

    return await AlertModel.findById(id);
  }

  /**
   * @param {number} id
   */
  async deleteById(id) {
    if (!id || Number.isNaN(id)) {
      throw new HttpError({
        code: 400,
        clientMessage: "Alert ID must be included",
      });
    }

    const result = await AlertModel.deleteWhere("id", id);

    return result?.changes !== 0;
  }
}

const alertsService = new AlertsService();

module.exports = alertsService;
