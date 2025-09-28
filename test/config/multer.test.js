const chai = require("chai");
const {
  imageUpload,
  generateFileName,
  fileFilter,
} = require("src/config/multer.config");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;

chai.use(sinonChai);
chai.use(chaiAsPromised);
const { expect } = chai;

describe("MulterConfig", () => {
  describe("generateFileName", () => {
    it("should generate random file name including orignal extension", (done) => {
      const mockFile = { originalname: "photo.png" };

      generateFileName({}, mockFile, (err, filename) => {
        expect(err).to.be.null;
        expect(filename).to.contain(".png");
        done();
      });
    });
  });

  describe("fileFilter", () => {
    it("should return true for valid file mimetypes", (done) => {
      const mockFile = { mimetype: "image/jpeg" };

      fileFilter({}, mockFile, (err, accepted) => {
        expect(err).to.be.null;
        expect(accepted).to.be.true;
        done();
      });
    });

    it("should return false for invalid file mimetypes", (done) => {
      const mockFile = { mimetype: "image/webp" };

      fileFilter({}, mockFile, (err, accepted) => {
        expect(err).to.be.null;
        expect(accepted).to.be.false;
        done();
      });
    });
  });

  describe("imageUpload", () => {
    it("should return a multer middleware function", () => {
      const upload = imageUpload();

      expect(typeof upload).to.be.equal("object");
      expect(upload).to.have.property("single");
      expect(upload).to.have.property("array");
      expect(upload).to.have.property("fields");
    });
  });
});
