const { Router } = require("express");
const mfaController = require("src/controllers/mfa.controller");

const mfaRouter = Router();

mfaRouter.post("/resend-code", mfaController.resendCode);
mfaRouter.post("/verify-code", mfaController.verifyCode);

module.exports = mfaRouter;
