const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
const setupBaseModelStubs = require("../testing-utils/baseModelMocks");

const readline = require("node:readline");
const {
  getUserInput,
  getUserTerminalInput,
  generateUsername,
  createOfficer,
} = require("src/scripts/create_officer");

chai.use(sinonChai);
chai.use(chaiAsPromised);
const { expect } = chai;

describe("createOfficerScript", () => {
  /** @type {import("../testing-utils/baseModelMocks").BaseModelStubs} */
  let baseModelStubs;
  let processArgv;
  let rlStub;

  before(() => {
    processArgv = process.argv;
  });

  beforeEach(() => {
    baseModelStubs = setupBaseModelStubs();

    rlStub = {
      question: sinon.stub(),
      close: sinon.stub(),
    };

    rlStub.question.onCall(0).callsFake((_, cb) => {
      cb(null, "John");
    });
    rlStub.question.onCall(1).callsFake((_, cb) => {
      cb(null, "Smith");
    });
    rlStub.question.onCall(2).callsFake((_, cb) => {
      cb(null, "example333");
    });
    rlStub.question.onCall(3).callsFake((_, cb) => {
      cb(null, "example@email.com");
    });

    sinon.stub(readline, "createInterface").returns(rlStub);

    sinon.stub(console, "error");
    sinon.stub(console, "table");

    process.argv = [];
  });

  afterEach(() => {
    sinon.restore();
  });

  after(() => {
    process.argv = processArgv;
  });

  describe("getUserInput", () => {
    it("should get user input from process.argv", () => {
      process.argv = [
        "",
        "",
        "john",
        "smith",
        "example333",
        "example@email.com",
      ];

      const userInput = getUserInput();

      expect(userInput.first_name).to.be.equal("john");
      expect(userInput.last_name).to.be.equal("smith");
      expect(userInput.password).to.be.equal("example333");
      expect(userInput.email).to.be.equal("example@email.com");
    });

    it("should propagate errros", () => {
      process.argv = ["", "", "john", "smith", "example333"];

      expect(() => getUserInput()).to.throw("Input Validation Error");
    });
  });

  describe("getUserTerminalInput", () => {
    it("should get user input from terminal", async () => {
      await getUserTerminalInput();
      const userInput = process.argv;

      expect(userInput[0]).to.be.equal("John");
      expect(userInput[1]).to.be.equal("Smith");
      expect(userInput[2]).to.be.equal("example333");
      expect(userInput[3]).to.be.equal("example@email.com");
    });

    it("should propagate errors", async () => {
      rlStub.question.onCall(2).callsFake((_, cb) => {
        cb(new Error());
      });
      await expect(getUserTerminalInput()).to.be.rejected;
    });
  });

  describe("generateUsername", () => {
    it("should generate a random username", () => {
      const username = generateUsername();

      expect(username).to.match(/ID-\d{3}/);
    });
  });

  describe("createOfficer", () => {
    it("should create officer account", async () => {
      baseModelStubs.save.callsFake(function () {
        return this;
      });

      process.argv = [
        "",
        "",
        "john",
        "smith",
        "example333",
        "example@email.com",
      ];

      const officer = await createOfficer();

      expect(officer.email).to.be.equal("example@email.com");
      expect(officer.username).to.match(/ID-\d{3}/);
    });
  });
});
