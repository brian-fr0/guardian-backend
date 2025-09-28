const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const ExpressMockRequest = require("../testing-utils/expressRequest");
const ExpressMockResponse = require("test/testing-utils/expressResponse");
const dialogflowController = require("src/controllers/dialogflow.controller");
const dialogflowService = require("src/services/dialogflow.service");
const chaiAsPromised = require("chai-as-promised").default;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("DialogflowController", () => {
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
    it("should send chat response to client", async () => {
      req.body = {
        text: "Hello",
        languageCode: "en",
      };

      const chatStub = sinon.stub(dialogflowService, "chat").resolves({
        intent: "test.intent",
        confidence: 0.7,
        text: "Example text",
        sessionId: "79efc5dc-a5b3-400d-a223-4a2d34af575d",
      });

      await dialogflowController.chat(req, res);

      const jsonResponse = ExpressMockResponse.getResponseJsonBody(res);

      expect(jsonResponse.data).to.have.property("text");
      expect(jsonResponse.data).to.have.property("sessionId");
      expect(chatStub).to.be.calledOnceWithExactly({
        text: "Hello",
        languageCode: "en",
      });
    });

    it("should propagate errors", async () => {
      req.body = {
        text: "Hello",
        languageCode: "en",
      };

      const chatStub = sinon.stub(dialogflowService, "chat").rejects();

      await expect(dialogflowController.chat(req, res)).to.be.rejected;
    });
  });
});
