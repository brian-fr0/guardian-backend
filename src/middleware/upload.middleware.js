const multer = require("multer");

const storage = multer.memoryStorage();

// Allow only JPEG/PNG and max 5MB files
function fileFilter(_req, file, cb) {
  const ok = ["image/jpeg", "image/png"].includes(file.mimetype);
  cb(ok ? null : new Error("Only JPEG/PNG images are allowed"), ok);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { upload };
