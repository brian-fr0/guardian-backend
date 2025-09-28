const z = require("zod");
const { v4: uuidv4 } = require("uuid");
const dialogflow = require("@google-cloud/dialogflow");

class DialogflowService {
  dialogflowContent = z.object({
    text: z.string(),
    sessionId: z.string().optional(),
    languageCode: z.string(),
    projectId: z.string(),
  });

  #client;

  constructor() {
    this.#client = new dialogflow.SessionsClient();
  }

  async chat(body) {
    body.projectId = process.env.DF_PROJECT_ID;
    const content = this.dialogflowContent.parse(body);

    if (!content?.sessionId?.trim()) {
      content.sessionId = uuidv4();
    }

    const sessionPath = this.#client.projectAgentSessionPath(
      content.projectId,
      content.sessionId,
    );

    const [response] = await this.#client.detectIntent({
      session: sessionPath,
      queryInput: {
        text: { text: content.text, languageCode: content.languageCode },
      },
    });

    const result = response.queryResult;

    return {
      intent: result.intent?.displayName || null,
      confidence: result.intentDetectionConfidence || 0,
      text: result.fulfillmentText || "",
      sessionId: content.sessionId,
    };
  }
}

const dialogflowService = new DialogflowService();

module.exports = dialogflowService;
