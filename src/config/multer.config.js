const multer = require("multer");
const { randomBytes } = require("node:crypto");
const { extname } = require("node:path");

const ACCEPTED_IMAGE_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

/**
 * @param {import("express").Request} _
 * @param {Express.Multer.File} file
 * @param {(error: Error | null, filename: string)} cb
 */
function generateFileName(_, file, cb) {
  const fileName = randomBytes(16).toString("hex") + extname(file.originalname);
  return cb(null, fileName);
}

/**
 * @param {import("express").Request} _
 * @param {Express.Multer.File} file
 * @param {multer.FileFilterCallback} cb
 */
function fileFilter(_, file, cb) {
  if (ACCEPTED_IMAGE_FILE_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(null, false);
}

/**
 * @param {string} [dest="uploads/"]
 * @param {number} [fileSize=5000000]
 * @returns {import("multer").Multer}
 */
function imageUpload(dest = "uploads/", fileSize = 5000000) {
  const storage = multer.diskStorage({
    destination: dest,
    filename: generateFileName,
  });

  return multer({
    storage,
    limits: {
      fileSize,
    },
    fileFilter,
  });
}

module.exports = {
  imageUpload,
  generateFileName,
  fileFilter,
};
