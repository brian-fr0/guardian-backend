const lostArticleService = require("../services/lost-articles.service");
const personalDetailsService = require("../services/personal-details.service");
const HttpResponse = require("../utils/http-response-helper");

class LostArticlesController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    const lostArticle = await lostArticleService.create(
      req.files,
      req.body,
      req.user,
    );

    new HttpResponse(200, lostArticle).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async delete(req, res) {
    const { lostArticleId } = req.params;

    const deleted = await lostArticleService.deleteById(lostArticleId);

    if (!deleted) {
      return new HttpResponse(404).sendStatus(res);
    }

    new HttpResponse(204).sendStatus(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async deletePersonalDetails(req, res) {
    const { lostArticleId, personalDetailsId } = req.params;

    const deleted =
      await personalDetailsService.deleteLostArticlePersonalDetails(
        lostArticleId,
        personalDetailsId,
      );

    if (!deleted) {
      return new HttpResponse(404).sendStatus(res);
    }

    new HttpResponse(204).sendStatus(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getById(req, res) {
    const id = req.params.id;
    const lostArticle = await lostArticleService.getById(id, req.user);

    if (!lostArticle) {
      return new HttpResponse(404).sendStatus(res);
    }

    new HttpResponse(200, lostArticle).json(res);
  }

  /**
   * @param {import('express').Response} res
   */
  async getAll(_, res) {
    const lostArticles = await lostArticleService.getAll();
    new HttpResponse(200, lostArticles).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async createPersonalDetails(req, res) {
    const id = req.params.id;
    const canModifyLostArticle = await lostArticleService.canModify(
      id,
      req.user,
    );

    if (!canModifyLostArticle) {
      throw new HttpError({ code: 401 });
    }

    const personalDetails =
      await personalDetailsService.createLostArticlePersonalDetails(
        req.body,
        id,
      );
    new HttpResponse(200, personalDetails).json(res);
  }
}

const lostArticlesControler = new LostArticlesController();

module.exports = lostArticlesControler;
