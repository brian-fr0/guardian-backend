const notesService = require("src/services/notes.service");
const HttpResponse = require("src/utils/http-response-helper");

class NotesController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async resourceCreate(req, res) {
    const body = {
      ...req.body,
      resource_id: req.params.resourceId,
      resource_type: req.query.resourceType,
    };
    new HttpResponse(200, await notesService.resourceCreate(body)).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async resourceGetAll(req, res) {
    const properties = {
      ...req.query,
      ...req.params,
      userId: req.user,
      officer: req.officer === 1,
    };
    new HttpResponse(200, await notesService.resourceGetAll(properties)).json(
      res,
    );
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getById(req, res) {
    const result = await notesService.getById(req.params.noteId, req.user);

    if (!result) {
      return new HttpResponse(404).sendStatus(res);
    }

    new HttpResponse(200, result).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateById(req, res) {
    const result = await notesService.updateById(
      req.params.noteId,
      req.body,
      req.user,
    );

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
    const deleted = await notesService.deleteById(req.params.noteId);

    if (!deleted) {
      return new HttpResponse(404).sendStatus(res);
    }

    new HttpResponse(204).sendStatus(res);
  }
}

const notesController = new NotesController();

module.exports = notesController;
