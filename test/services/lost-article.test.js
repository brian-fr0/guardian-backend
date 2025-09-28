const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
const setupBaseModelStubs = require("../testing-utils/baseModelMocks");
const lostArticleService = require("src/services/lost-articles.service");

chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("LostArticleService", () => {
  /** @type {import("../testing-utils/baseModelMocks").BaseModelStubs} */
  let baseModelStubs;

  beforeEach(() => {
    baseModelStubs = setupBaseModelStubs();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("deleteById", () => {
    it("should delete lost article report and return true", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 1 });

      const deleted = await lostArticleService.deleteById(1);

      expect(deleted).to.be.true;
    });

    it("should return false if lost article report not found", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 0 });

      const deleted = await lostArticleService.deleteById(2);

      expect(deleted).to.be.false;
    });

    it("should throw if lostArticleId missing", async () => {
      await expect(lostArticleService.deleteById()).to.be.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.deleteWhere.rejects();

      await expect(lostArticleService.deleteById(1, 4)).to.rejected;
    });
  });
});
