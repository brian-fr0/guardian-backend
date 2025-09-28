const chai = require("chai");
const sinon = require("sinon");
const HttpError = require("../../src/utils/http-error");
const HttpResponse = require("../../src/utils/http-response-helper");
const ExpressMockResponse = require("../testing-utils/expressResponse");

const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("HttpResponse", () => {
  /** @type {import("../testing-utils/expressResponse").ResponseMock} */
  let res;

  beforeEach(() => {
    res = ExpressMockResponse.new();
  });

  afterEach(() => {
    sinon.restore();
    res = null;
  });

  describe("json", () => {
    it("should send the json response to the client", () => {
      const data = {
        example: "example",
      };

      new HttpResponse(200, data).json(res);

      const responseBody = ExpressMockResponse.getResponseJsonBody(res);

      expect(res.statusCode).to.be.equal(200);
      expect(responseBody.status).to.be.equal("success");
      expect(responseBody.data.example).to.be.equal("example");
      expect(res.headersSent).to.be.true;
    });

    it("should set status to error when code is outside the 2xx range", () => {
      new HttpResponse(400).json(res);

      const responseBody = ExpressMockResponse.getResponseJsonBody(res);

      expect(res.statusCode).to.be.equal(400);
      expect(responseBody.status).to.be.equal("error");
      expect(res.headersSent).to.be.true;
    });
  });

  describe("sendStatus", () => {
    it("should send the status code to the client", () => {
      new HttpResponse(200).sendStatus(res);

      expect(res.statusCode).to.be.equal(200);
      expect(res.headersSent).to.be.true;
    });
  });

  describe("send", () => {
    it("should send the string to the client", () => {
      new HttpResponse(200, {}, "example").send(res);

      expect(res.statusCode).to.be.equal(200);
      expect(res.body).to.be.equal("example");
      expect(res.headersSent).to.be.true;
    });
  });
});
