class HttpResponse {
  data;
  message;
  code;

  /**
   * @param {number} code
   * @param {{}} [data={}]
   * @param {string} [message=""]
   */
  constructor(code, data = {}, message = "") {
    this.code = code || 200;
    this.data = data;
    this.message = message;
  }

  /**
   * @param {import('express').Response} res
   */
  json(res) {
    res.status(this.code).json({
      status: this.code >= 200 && this.code < 300 ? "success" : "error",
      data: this.data,
      message: this.message,
    });
  }

  /**
   * @param {import('express').Response} res
   */
  sendStatus(res) {
    res.sendStatus(this.code);
  }

  /**
   * @param {import('express').Response} res
   */
  send(res) {
    res.status(this.code).send(this.message);
  }
}

module.exports = HttpResponse;
