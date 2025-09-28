const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const jwt = require("jsonwebtoken");
const filesService = require("../../src/services/files.service");

const { expect } = chai;

describe("FileService", () => {
  before(() => {
    process.env.JWT_FILES_SECRET = "fakeFileSecret";
  });

  describe("getFileNameFromToken", () => {
    it("should return filename", () => {
      const fileNameToken = jwt.sign(
        { sub: "filename.example" },
        process.env.JWT_FILES_SECRET,
      );

      const fileName = filesService.getFileNameFromToken(fileNameToken);

      expect(fileName).to.be.equal("filename.example");
    });
  });

  describe("generateFileToken", () => {
    it("should generate a valid jwt containing the filename", () => {
      const fileNameToken = filesService.generateFileToken(
        "filename.example",
        10,
      );

      const payload = jwt.decode(fileNameToken);

      expect(payload.sub).to.be.equal("filename.example");
      expect(payload.exp).to.be.equal(Math.floor(Date.now() / 1000) + 10);
    });
  });
});
