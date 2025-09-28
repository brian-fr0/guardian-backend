const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const ExpressMockRequest = require("../testing-utils/expressRequest");
const ExpressMockResponse = require("test/testing-utils/expressResponse");
const { resolve } = require("node:path");
const filesService = require("src/services/files.service");
const filesController = require("src/controllers/files.controller");
const chaiAsPromised = require("chai-as-promised").default;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("FilesController", () => {
  /** @type {import("test/testing-utils/expressRequest").RequestMock} */
  let req;
  /** @type {import("test/testing-utils/expressResponse").ResponseMock} */
  let res;

  beforeEach(() => {
    req = ExpressMockRequest.new();
    res = ExpressMockResponse.new();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("get", () => {
    it("should get file and send to client", async () => {
      req.query = {
        token: "exampletoken",
      };

      const getFileNameStub = sinon
        .stub(filesService, "getFileNameFromToken")
        .returns(resolve("uploads/"));

      await filesController.get(req, res);

      expect(getFileNameStub).to.be.calledOnceWithExactly("exampletoken");
    });

    it("should propagate errors", async () => {
      sinon.stub(filesService, "getFileNameFromToken").rejects();
      await expect(filesController.get(req, res)).to.be.rejected;
    });
  });
});
