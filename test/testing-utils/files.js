const { randomBytes } = require("node:crypto");

function createMockFile({ size = 100, fieldname = "files", mimetype = "txt" }) {
  return {
    fieldname,
    orignalName: `${randomBytes(3).toString("base64")}.${mimetype}`,
    size,
    mimetype,
    buffer: Buffer.alloc(size * 0.01),
  };
}

function createMockFilesArray({
  size = 100,
  fieldname = "files",
  mimetype = "txt",
  multiplySizeBy = 0,
  count = 1,
}) {
  return new Array(count).fill(undefined).map(() => {
    const file = createMockFile({ size, fieldname, mimetype });
    size = size * multiplySizeBy;
    return file;
  });
}

const sizes = {
  KB: 1024,
  MB: 1048576,
  GB: 1048576000,
};

module.exports = { createMockFile, createMockFilesArray, sizes };
