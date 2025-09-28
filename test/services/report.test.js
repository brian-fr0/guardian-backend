require("dotenv").config();
const chai = require("chai");
const sinon = require("sinon");
const setupBaseModelStubs = require("../testing-utils/baseModelMocks");
const { sizes, createMockFilesArray } = require("../testing-utils/files");
const ReportImagesModel = require("../../src/models/report-images.model");
const ReportModel = require("../../src/models/report.model");
const personalDetailsService = require("../../src/services/personal-details.service");
const PersonalDetailsModel = require("../../src/models/personal-details.model");
const UserModel = require("../../src/models/user.model");
const database = require("../../src/config/database");
const textPriority = require("src/utils/local_priority_model");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("ReportsService", () => {
  /** @type {import("../testing-utils/baseModelMocks").BaseModelStubs} */
  let baseModelStubs;
  let reportsService;

  const reportDetails = {
    description: "test description",
    longitude: "0",
    latitude: "0",
  };

  const reportModel = new ReportModel("example description", 0, 0, 1, 0.4);

  const genImg = (mb = 1, multiplySizeBy = 0, count = 1) => {
    return createMockFilesArray({
      size: sizes.MB * mb,
      multiplySizeBy,
      count,
      mimetype: "image/jpeg",
    });
  };

  beforeEach(() => {
    sinon.stub(textPriority, "getTextPriority").resolves(1);
    baseModelStubs = setupBaseModelStubs();

    sinon.stub(database, "withTransaction").callsFake(async (cb) => {
      return await cb();
    });

    delete require.cache[require.resolve("../../src/services/reports.service")];
    reportsService = require("../../src/services/reports.service");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("create", () => {
    it("should create report model", async () => {
      const reportSaved = await reportsService.create([], reportDetails, 1);

      expect(reportSaved.description).to.be.equal("test description");
      expect(reportSaved.longitude).to.be.equal(0);
      expect(reportSaved.latitude).to.be.equal(0);
      expect(reportSaved.user_id).to.be.equal(1);
    });

    it("should throw if fields are wrong type", async () => {
      const invalidReportDetails = {
        description: 444,
        longitude: "0",
        latitude: "1",
      };
      await expect(reportsService.create([], invalidReportDetails, 1)).to.be
        .rejected;
    });

    it("should call save on the model", async () => {
      await reportsService.create([], reportDetails, 1);

      expect(baseModelStubs.save).to.have.been.calledOnce;
    });

    it("should propagate BaseModel.save errors", async () => {
      baseModelStubs.save.rejects();

      await expect(reportsService.create(genImg(2), reportDetails, 1)).to.be
        .rejected;
    });
  });

  describe("getById", () => {
    it("should return report model", async () => {
      baseModelStubs.findById.resolves(reportModel);
      sinon.stub(personalDetailsService, "findByReportId").resolves(null);
      baseModelStubs.findAllBy.resolves(null);

      const report = await reportsService.getById(1);

      expect(baseModelStubs.findById).to.have.been.calledWith(1);
      expect(report.description).to.be.equal("example description");
    });

    it("should return report model with attached personal details model", async () => {
      baseModelStubs.findById.resolves(reportModel);
      const personalDetailsModel = new PersonalDetailsModel(
        "John",
        "Smith",
        "12-12-2000",
        "",
      );
      const findPersonalDetailsStub = sinon
        .stub(personalDetailsService, "findByReportId")
        .resolves([personalDetailsModel]);
      baseModelStubs.findAllBy.resolves(null);

      const report = await reportsService.getById(1);

      expect(findPersonalDetailsStub).to.have.been.calledOnce;
      expect(Array.isArray(report.witnesses)).to.be.true;
      expect(report.witnesses).to.have.lengthOf(1);
    });

    it("should return report model with attached image", async () => {
      baseModelStubs.findById.resolves(reportModel);
      const reportImage = new ReportImagesModel(1, "/some/path");
      baseModelStubs.findAllBy.onSecondCall().resolves([reportImage]);

      const report = await reportsService.getById(1);

      expect(baseModelStubs.findAllBy).to.have.been.calledTwice;
      expect(Array.isArray(report.images)).to.be.true;
      expect(report.images).to.have.lengthOf(1);
    });

    it("should throw if id is missing", async () => {
      await expect(reportsService.getById()).to.have.been.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.findById.rejects();

      await expect(reportsService.getById(1)).to.have.been.rejected;
    });
  });

  describe("canModify", () => {
    it("should return true when user has ownership of a report", async () => {
      baseModelStubs.findById.resolves(reportModel);
      const canModifyReport = await reportsService.canModify(1, 1, false);
      expect(canModifyReport).to.be.true;
    });

    it("should return true when user is a officer", async () => {
      baseModelStubs.findById.resolves(reportModel);
      const canModifyReport = await reportsService.canModify(1, 3, true);
      expect(canModifyReport).to.be.true;
    });

    it("should return false if user is not a officer and does not have ownership", async () => {
      baseModelStubs.findById.resolves(reportModel);
      const canModifyReport = await reportsService.canModify(1, 3, false);
      expect(canModifyReport).to.be.false;
    });
  });

  describe("canUserView", () => {
    it("should return true when user has ownership of a report", async () => {
      const user = new UserModel("example", "", "", false);
      user.id = 1;
      baseModelStubs.findById.resolves(user);
      const canViewReport = await reportsService.canUserView(reportModel, 1);
      expect(canViewReport).to.be.true;
    });

    it("should return true when user is a officer", async () => {
      const user = new UserModel("example", "", "", true);
      user.id = 3;
      baseModelStubs.findById.resolves(user);
      const canViewReport = await reportsService.canUserView(reportModel, 1);
      expect(canViewReport).to.be.true;
    });

    it("should return false if user is not a officer and does not have ownership", async () => {
      const user = new UserModel("example", "", "", false);
      user.id = 3;
      baseModelStubs.findById.resolves(user);
      const canViewReport = await reportsService.canUserView(reportModel, 1);
      expect(canViewReport).to.be.true;
    });
  });

  describe("getAll", () => {
    it("should return all found report models for the user id provided", async () => {
      baseModelStubs.findAllBy.resolves([reportModel]);

      const reports = await reportsService.getAll(1);

      expect(Array.isArray(reports)).to.be.true;
      expect(reports).to.be.lengthOf(1);
      expect(reports[0].description).to.be.equal(reportModel.description);
    });

    it("should return all found report models", async () => {
      baseModelStubs.all.resolves([reportModel]);

      const reports = await reportsService.getAll();

      expect(Array.isArray(reports)).to.be.true;
      expect(reports).to.be.lengthOf(1);
      expect(reports[0].description).to.be.equal(reportModel.description);
    });

    it("should propagate errors", async () => {
      baseModelStubs.findAllBy.rejects();

      await expect(reportsService.getAll(1)).to.be.rejected;
    });
  });

  describe("updateStatus", () => {
    it("should update report status", async () => {
      baseModelStubs.findById.resolves(reportModel);
      const reportUpdated = await reportsService.updateStatus(1, {
        status: "COMPLETED",
      });

      expect(baseModelStubs.save).to.have.been.calledOnce;
      expect(reportUpdated.status).to.be.equal("COMPLETED");
    });

    it("should throw with invalid status", async () => {
      baseModelStubs.findById.resolves(reportModel);
      await expect(
        reportsService.updateStatus(1, {
          status: "DONE",
        }),
      ).to.be.rejected;
    });

    it("should throw when no report is found", async () => {
      await expect(
        reportsService.updateStatus(1, {
          status: "COMPLETED",
        }),
      ).to.be.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.findById.rejects();

      await expect(reportsService.updateStatus(5, { status: "COMPLETED" })).to
        .be.rejected;
    });
  });
});
