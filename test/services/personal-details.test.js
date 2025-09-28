require("dotenv").config();
const chai = require("chai");
const sinon = require("sinon");
const setupBaseModelStubs = require("../testing-utils/baseModelMocks");
const PersonalDetailsModel = require("../../src/models/personal-details.model");
const personalDetailsService = require("../../src/services/personal-details.service");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("PersonalDetailsService", function () {
  /** @type {import("../testing-utils/baseModelMocks").BaseModelStubs} */
  let baseModelStubs;

  beforeEach(() => {
    baseModelStubs = setupBaseModelStubs();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("create", () => {
    it("should create a personal details model", async () => {
      const personalDetails = {
        first_name: "john",
        last_name: "smith",
        date_of_birth: "1988-09-09",
        contact_number: "07856234543",
      };

      const personalDetailsSaved =
        await personalDetailsService.create(personalDetails);

      expect(personalDetailsSaved.first_name).to.be.equal("john");
    });

    it("should throw if given wrong date format/type", async () => {
      const personalDetails = {
        first_name: "john",
        last_name: "smith",
        date_of_birth: new Date().toString(),
        contact_number: "07856234543",
      };

      await expect(personalDetailsService.create(personalDetails)).to.be
        .rejected;
    });

    it("should throw if fields are wrong type", async () => {
      const personalDetails = {
        first_name: 123,
        last_name: "smith",
        date_of_birth: "1988-09-09",
        contact_number: "07856234543",
      };
      await expect(personalDetailsService.create(personalDetails)).to.be
        .rejected;
    });

    it("should call save on the model", async () => {
      const personalDetails = {
        first_name: "john",
        last_name: "smith",
        date_of_birth: "1988-09-09",
        contact_number: "07856234543",
      };
      await personalDetailsService.create(personalDetails);
      expect(baseModelStubs.save).to.have.been.calledOnce;
    });
  });

  describe("deleteReportWitness", () => {
    it("should delete witness and return true", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 1 });

      const deleted = await personalDetailsService.deleteReportWitness(1, 4);

      expect(deleted).to.be.true;
    });

    it("should return false if witness not found", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 0 });

      const deleted = await personalDetailsService.deleteReportWitness(1, 5);

      expect(deleted).to.be.false;
    });

    it("should throw if reportId or witnessId missing", async () => {
      await expect(personalDetailsService.deleteReportWitness(1)).to.be
        .rejected;
      await expect(personalDetailsService.deleteReportWitness()).to.be.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.deleteWhere.rejects();

      await expect(personalDetailsService.deleteReportWitness(1, 4)).to
        .rejected;
    });
  });

  describe("deleteLostArticlePersonalDetails", () => {
    it("should delete lost article personal details and return true", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 1 });

      const deleted =
        await personalDetailsService.deleteLostArticlePersonalDetails(1, 4);

      expect(deleted).to.be.true;
    });

    it("should return false if lost article personal details not found", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 0 });

      const deleted =
        await personalDetailsService.deleteLostArticlePersonalDetails(1, 5);

      expect(deleted).to.be.false;
    });

    it("should throw if lostArticleId or personalDetailsId  missing", async () => {
      await expect(personalDetailsService.deleteLostArticlePersonalDetails(1))
        .to.be.rejected;
      await expect(personalDetailsService.deleteLostArticlePersonalDetails()).to
        .be.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.deleteWhere.rejects();

      await expect(
        personalDetailsService.deleteLostArticlePersonalDetails(1, 4),
      ).to.rejected;
    });
  });
});
