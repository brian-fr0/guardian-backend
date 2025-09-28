const alertsService = require("src/services/alerts.service");
const HttpResponse = require("src/utils/http-response-helper");

class AlertsController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async all(req, res) {
    new HttpResponse(
      200,
      await alertsService.all(20, req.query?.page || 0),
    ).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    new HttpResponse(200, await alertsService.create(req.body)).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getById(req, res) {
    const result = await alertsService.getById(req.params.alertId);

    if (!result) {
      return new HttpResponse(404).sendStatus(res);
    }

    new HttpResponse(200, result).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async deleteById(req, res) {
    const deleted = await alertsService.deleteById(req.params.alertId);

    if (!deleted) {
      return new HttpResponse(404).sendStatus(res);
    }

    return new HttpResponse(204).sendStatus(res);
  }
}

const alertsController = new AlertsController();

module.exports = alertsController;
