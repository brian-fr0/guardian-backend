/** @typedef {Object} RequestMock
 * @property {boolean} finished
 * @property {boolean} destroyed
 * @property {Object} headers
 * @property {Object|undefined} body
 * @property {Object} cookies
 * @property {string} method
 * @property {Object} params
 * @property {Object} query
 * @property {import("./expressResponse").ResponseMock} res
 * @property {number} maxHeadersCount
 * @property {string} path
 * @property {string} host
 * @property {string} protocol
 *
 * @property {Function} getHeader
 * @property {Function} setHeader
 * @property {Function} getHeaderNames
 * @property {Function} getHeaders
 * @property {Function} getRawHeaderNames
 * @property {Function} hasHeader
 * @property {Function} removeHeader
 * @property {Function} end
 * @property {Function} destroy
 *
 *
 * @property {boolean} writableFinished
 * @property {boolean} writableEnded
 */

class ExpressMockRequest {
  /**
   * @returns {RequestMock}
   */
  static new() {
    const request = {
      finished: false,
      destroyed: false,
      headers: {},
      body: undefined,
      cookies: {},
      method: "",
      params: {},
      query: {},
      res: null,
      maxHeadersCount: 2000,
      path: "",
      host: "",
      protocol: "",

      getHeader(name) {
        return this.headers[name];
      },
      setHeader(name, value) {
        this.headers[name] = value;
        return this;
      },
      getHeaderNames() {
        return Object.keys(this.headers);
      },
      getHeaders() {
        return Object.fromEntries(
          Object.entries(this.headers).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ]),
        );
      },
      getRawHeaderNames() {
        return Object.keys(this.headers);
      },
      hasHeader(name) {
        return Object.hasOwn(this.headers, name);
      },
      removeHeader(name) {
        if (this.hasHeader(name)) {
          delete this.headers[name];
        }
      },
      end(chunk, encoding, callback) {
        this.finished = true;
      },
      destroy(error) {
        if (this.destroyed) {
          return this;
        }

        this.destroyed = true;

        return this;
      },
    };

    Object.defineProperty(request, "writableFinished", {
      get() {
        return this._finshed === true;
      },
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(request, "writableEnded", {
      get() {
        return this._finshed === true;
      },
      enumerable: true,
      configurable: true,
    });

    return request;
  }
}

module.exports = ExpressMockRequest;
