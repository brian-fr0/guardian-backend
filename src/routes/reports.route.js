const { Router } = require("express");
const OfficerAuthenticationMiddleware = require("../middleware/officer-authorization.middleware");
const reportsController = require("../controllers/reports.controller");
const { imageUpload } = require("src/config/multer.config");

const upload = imageUpload();
const reportsRouter = Router();

reportsRouter.get("/", reportsController.getAll);
reportsRouter.get("/:id", reportsController.getById);

reportsRouter.post("/", upload.array("photos", 12), reportsController.create);
reportsRouter.post("/witness/:id", reportsController.createWitness);
reportsRouter.delete(
  "/witness/:reportId/:witnessId",
  OfficerAuthenticationMiddleware,
  reportsController.deleteWitness,
);
reportsRouter.patch(
  "/update-status/:id",
  OfficerAuthenticationMiddleware,
  reportsController.updateStatus,
);

reportsRouter.delete(
  "/delete/:id",
  OfficerAuthenticationMiddleware,
  reportsController.delete,
);

module.exports = reportsRouter;