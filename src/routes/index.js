const { Router } = require("express");
const AuthorisationMiddleware = require("../middleware/authorization.middleware");

const reportsRouter = require("./reports.route");
const lostArticlesRouter = require("./lost-articles.route");
const authenticationRouter = require("./authentication.route");
const mapBoxRouter = require("./map-box.route");
const fileRouter = require("./files.route");               // auth-only: /upload, /:id/sign
const filesPublicRouter = require("./files.public.route"); // public: /download
const alertsRouter = require("./alerts.route");
const dialogflowRouter = require("./dialogflow.route");
const notesRouter = require("./notes.route");
const LastSeenMiddleware = require("src/middleware/last-seen.middleware");
const mfaRouter = require("./mfa.route");

const router = Router();
const routerAuthenticated = Router();

/* ---------- Public routes ---------- */
router.use("/api/v1/auth", authenticationRouter);
router.use("/api/v1/mfa", mfaRouter);

// Only /api/v1/files/download is exposed publicly via this router
router.use("/api/v1/files", filesPublicRouter);

/* ---------- Authenticated routes ---------- */
routerAuthenticated.use(AuthorisationMiddleware);
routerAuthenticated.use(LastSeenMiddleware);

// Files that require auth: /upload, /:id/sign
routerAuthenticated.use("/api/v1/files", fileRouter);

routerAuthenticated.use("/api/v1/reports", reportsRouter);
routerAuthenticated.use("/api/v1/lost-articles", lostArticlesRouter);
routerAuthenticated.use("/api/v1/map-box", mapBoxRouter);
routerAuthenticated.use("/api/v1/alerts", alertsRouter);
routerAuthenticated.use("/api/v1/notes", notesRouter);
routerAuthenticated.use("/api/v1/dialogflow", dialogflowRouter);

// Mount the authenticated subtree last
router.use(routerAuthenticated);

module.exports = router;
