require("dotenv").config({
  path: "../.env.test",
});
process.env.NODE_PATH = process.env.NODE_PATH || ".";
require("node:module").Module._initPaths();

const sinon = require("sinon");
const dialogflow = require("@google-cloud/dialogflow");

sinon.stub(dialogflow, "SessionsClient").returns({
  projectAgentSessionPath: sinon.stub().returns("mock-path"),
  detectIntent: sinon.stub().resolves([
    {
      queryResult: {
        intent: { displayName: "test.intent" },
        fulfillmentText: "Mock response",
      },
    },
  ]),
});
