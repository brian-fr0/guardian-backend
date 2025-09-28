const authenticationService = require("src/services/authentication.service");
const mfaService = require("src/services/mfa.service");
const HttpResponse = require("src/utils/http-response-helper");

class MFAController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async verifyCode(req, res) {
    const payload = await mfaService.verifyCode(
      req.body.mfa_token,
      req.body.code,
    );
    await authenticationService.mfaVerified(payload.sub);
    new HttpResponse(204).sendStatus(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async resendCode(req, res) {
    const payload = await mfaService.verifyToken(req.body.mfa_token);
    new HttpResponse(200, {
      mfa_token: await mfaService.generateToken(
        payload.sub,
        payload.email,
        payload.exp,
      ),
    }).json(res);
  }
}

const mfaController = new MFAController();

module.exports = mfaController;
