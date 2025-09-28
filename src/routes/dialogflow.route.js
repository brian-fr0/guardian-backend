const { Router } = require("express");
const dialogflowController = require("src/controllers/dialogflow.controller");
const { scrubChatInput } = require("src/middleware/pii-scrubber.middleware");

const dialogflowRouter = Router();

dialogflowRouter.post("/chat", dialogflowController.chat);

module.exports = dialogflowRouter;
