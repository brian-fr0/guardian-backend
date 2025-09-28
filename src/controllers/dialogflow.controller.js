const dialogflowService = require("src/services/dialogflow.service");
const HttpResponse = require("src/utils/http-response-helper");

class DialogflowController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async chat(req, res) {
    const dialogflowResponse = await dialogflowService.chat(req.body);
    new HttpResponse(200, dialogflowResponse).json(res);
  }
}

const dialogflowController = new DialogflowController();

module.exports = dialogflowController;