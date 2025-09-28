const { Router } = require("express");
const HttpResponse = require("../utils/http-response-helper");

const mapBoxRouter = Router();

mapBoxRouter.get("/token", (req, res) => {
  new HttpResponse(200, { token: process.env.MAP_BOX_TOKEN }).json(res);
});

module.exports = mapBoxRouter;
