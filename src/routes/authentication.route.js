const { Router } = require("express");
const AuthorisationMiddleware = require("../middleware/authorization.middleware");
const rateLimitMiddleware = require("../middleware/rate-limiting.middleware");

const authenticationController = require("../controllers/authentication.controller");

const authenticationRouter = Router();

authenticationRouter.post(
  "/login",
  rateLimitMiddleware({ ipLimit: 15, ipWindowMs: 1000 * 60 * 5 }),
  authenticationController.login,
);
authenticationRouter.post(
  "/register",
  rateLimitMiddleware({ ipLimit: 15, ipWindowMs: 1000 * 60 * 5 }),
  authenticationController.register,
);
authenticationRouter.post(
  "/logout",
  AuthorisationMiddleware,
  authenticationController.logout,
);
authenticationRouter.post(
  "/logout-all",
  AuthorisationMiddleware,
  authenticationController.logoutAllSessions,
);
authenticationRouter.post("/refresh", authenticationController.refreshToken);

authenticationRouter.get(
  "/profile",
  AuthorisationMiddleware,
  authenticationController.profile,
);

authenticationRouter.get(
  "/is-authed",
  AuthorisationMiddleware,
  authenticationController.isAuthed,
);

module.exports = authenticationRouter;
