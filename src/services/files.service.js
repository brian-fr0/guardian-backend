const z = require("zod");
const jwt = require("jsonwebtoken");

const HttpError = require("../utils/http-error");

class FilesService {
  /**
   * @param {string} token
   * @returns {string}
   */
  getFileNameFromToken(token) {
    return jwt.verify(token, process.env.JWT_FILES_SECRET).sub;
  }

  /**
   * @param {string} file_path
   * @param {number} expiresInSeconds
   * @returns {string}
   */
  generateFileToken(file_path, expiresInSeconds = 60 * 10) {
    const fileAccessExp = Math.floor(Date.now() / 1000) + expiresInSeconds;

    return jwt.sign(
      { sub: file_path, exp: fileAccessExp },
      process.env.JWT_FILES_SECRET,
    );
  }
}

const filesService = new FilesService();

module.exports = filesService;
