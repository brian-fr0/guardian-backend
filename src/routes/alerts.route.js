const { Router } = require("express");
const alertsController = require("src/controllers/alerts.controller");
const OfficerAuthorizationMiddleware = require("src/middleware/officer-authorization.middleware");

const alertsRouter = Router();

alertsRouter.get("/", alertsController.all);
alertsRouter.post("/", OfficerAuthorizationMiddleware, alertsController.create);
alertsRouter.get("/:alertId", alertsController.getById);
alertsRouter.delete(
  "/:alertId",
  OfficerAuthorizationMiddleware,
  alertsController.deleteById,
);

module.exports = alertsRouter;
