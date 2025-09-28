require("dotenv").config();
const chai = require("chai");
const sinon = require("sinon");
const setupBaseModelStubs = require("../testing-utils/baseModelMocks");
const AlertModel = require("src/models/alert.model");
const alertsService = require("src/services/alerts.service");
const { ZodError } = require("zod");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("AlertsService", function () {
  /** @type {import("../testing-utils/baseModelMocks").BaseModelStubs} */
  let baseModelStubs;

  beforeEach(() => {
    baseModelStubs = setupBaseModelStubs();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("all", () => {
    it("should return found alerts", async () => {
      const alerts = [
        new AlertModel("Example Alert", "example description", "Example Type"),
      ];
      baseModelStubs.all.resolves(alerts);

      const alertsFound = await alertsService.all(20, 1);

      expect(Array.isArray(alertsFound)).to.be.true;
    });

    it("should propagate errors", async () => {
      baseModelStubs.all.rejects();

      await expect(alertsService.all(20, 1)).to.be.rejected;
    });
  });

  describe("create", () => {
    it("should create a alert", async () => {
      const body = {
        title: "Example title",
        description: "Example description",
        type: "Example type",
      };

      const alert = await alertsService.create(body);

      expect(alert).to.have.property("title");
      expect(alert).to.have.property("description");
      expect(alert).to.have.property("type");
    });

    it("should throw zod errors", async () => {
      const body = {
        title: 1444,
        description: "Example description",
        type: "Example type",
      };

      await expect(alertsService.create(body)).to.be.rejected.then((err) => {
        expect(err).to.be.instanceOf(ZodError);
      });
    });

    it("should propagate errors", async () => {
      const body = {
        title: "Example title",
        description: "Example description",
        type: "Example type",
      };

      baseModelStubs.save.rejects();

      await expect(alertsService.create(body)).to.be.rejected;
    });
  });

  describe("getById", () => {
    it("should return found alert", async () => {
      const alert = new AlertModel(
        "Example title",
        "Example description",
        "Example type",
      );
      baseModelStubs.findById.resolves(alert);

      const result = await alertsService.getById(1);

      expect(result).to.have.property("title");
      expect(result).to.have.property("description");
      expect(result).to.have.property("type");
    });

    it("should return null when no alert found", async () => {
      baseModelStubs.findById.resolves(null);

      const result = await alertsService.getById(1);

      expect(result).to.be.null;
    });

    it("should throw if alertId missing", async () => {
      await expect(alertsService.getById()).to.be.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.findById.rejects();

      await expect(alertsService.getById(1)).to.be.rejected;
    });
  });

  describe("deleteById", () => {
    it("should delete alert and return true", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 1 });

      const deleted = await alertsService.deleteById(1);

      expect(deleted).to.be.true;
    });

    it("should return false if alert not found", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 0 });

      const deleted = await alertsService.deleteById(1);

      expect(deleted).to.be.false;
    });

    it("should throw if alertId missing", async () => {
      await expect(alertsService.deleteById()).to.be.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.deleteWhere.rejects();

      await expect(alertsService.deleteById(1)).to.rejected;
    });
  });
});
