const filesService = require("../services/files.service");
const { resolve } = require("node:path");

class FilesController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async get(req, res) {
    const { token } = req.query;
    const filePath = filesService.getFileNameFromToken(token);
    res.sendFile(resolve(filePath));
  }
}

const filesController = new FilesController();

module.exports = filesController;
