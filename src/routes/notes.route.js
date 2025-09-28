const { Router } = require("express");
const notesController = require("src/controllers/notes.controller");
const OfficerAuthorizationMiddleware = require("src/middleware/officer-authorization.middleware");

const notesRouter = Router();

notesRouter.post(
  "/resource/:resourceId",
  OfficerAuthorizationMiddleware,
  notesController.resourceCreate,
);
notesRouter.get("/resource/:resourceId", notesController.resourceGetAll);
notesRouter.get("/:noteId", notesController.getById);
notesRouter.patch(
  "/:noteId",
  OfficerAuthorizationMiddleware,
  notesController.updateById,
);
notesRouter.delete(
  "/:noteId",
  OfficerAuthorizationMiddleware,
  notesController.deleteById,
);

module.exports = notesRouter;
