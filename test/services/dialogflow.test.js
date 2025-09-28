const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
const dialogflow = require("@google-cloud/dialogflow");

chai.use(sinonChai);
chai.use(chaiAsPromised);
const { expect } = chai;

describe("DialogflowService", () => {
  before(() => {
    process.env.DF_PROJECT_ID = "example_project";
  });

  describe("chat", () => {
    it("should send a chat to dialogflow SDK", async () => {
      const dialogflowService = require("src/services/dialogflow.service");

      const result = await dialogflowService.chat({
        text: "Hello",
        languageCode: "en",
      });

      expect(result.intent).to.equal("test.intent");
      expect(result).to.have.property("sessionId");
    });

    it("should propagate errors", async () => {
      const dialogflowService = require("src/services/dialogflow.service");

      await expect(dialogflowService.chat({ text: 14, languageCode: "en" })).to
        .be.rejected;
    });
  });
});
