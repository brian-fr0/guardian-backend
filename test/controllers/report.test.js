const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const ExpressMockRequest = require("../testing-utils/expressRequest");
const ExpressMockResponse = require("test/testing-utils/expressResponse");
const reportsController = require("src/controllers/reports.controller");
const reportsService = require("src/services/reports.service");
const ReportModel = require("src/models/report.model");
const personalDetailsService = require("src/services/personal-details.service");
const PersonalDetailsModel = require("src/models/personal-details.model");
const chaiAsPromised = require("chai-as-promised").default;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("ReportsController", () => {
  /** @type {import("test/testing-utils/expressRequest").RequestMock} */
  let req;
  /** @type {import("test/testing-utils/expressResponse").ResponseMock} */
  let res;

  beforeEach(() => {
    req = ExpressMockRequest.new();
    res = ExpressMockResponse.new();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("create", () => {
    it("should create a report", async () => {
      const reqBody = {
        description: "example description",
        latitude: 0,
        longitude: 0,
      };
      const report = new ReportModel(
        reqBody.description,
        reqBody.longitude,
        reqBody.latitude,
        1,
        1,
      );
      const resPromise = Promise.resolve(report);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, report);

      req.body = reqBody;
      req.user = 1;

      const createReportStub = sinon
        .stub(reportsService, "create")
        .returns(resPromise);

      await reportsController.create(req, res);

      expect(createReportStub)
        .to.be.calledOnceWithExactly(undefined, reqBody, 1)
        .returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should propagate errors", async () => {
      const reqBody = {
        description: "example description",
        latitude: 0,
        longitude: 0,
      };

      req.params = reqBody;
      req.user = 1;

      sinon.stub(reportsService, "create").rejects();

      await expect(reportsController.create(req, res)).to.be.rejected;
    });
  });

  describe("getById", () => {
    it("should return a report", async () => {
      const report = new ReportModel("description", 0, 0, 1, 1);
      const resPromise = Promise.resolve(report);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, report);

      req.params = {
        id: 1,
      };

      const getReportStub = sinon
        .stub(reportsService, "getById")
        .returns(resPromise);

      sinon.stub(reportsService, "canUserView").returns(true);

      await reportsController.getById(req, res);

      expect(getReportStub).to.be.calledOnceWithExactly(1).returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should return a 401 response when user can't view report", async () => {
      const report = new ReportModel("description", 0, 0, 1, 1);
      const resPromise = Promise.resolve(report);

      req.params = {
        id: 1,
      };

      const getReportStub = sinon
        .stub(reportsService, "getById")
        .returns(resPromise);

      sinon.stub(reportsService, "canUserView").returns(false);

      await reportsController.getById(req, res);

      expect(getReportStub).to.be.calledOnceWithExactly(1).returned(resPromise);
      expect(res.statusCode).to.be.equal(401);
    });

    it("should propagate errors", async () => {
      req.params = {
        id: 1,
      };

      sinon.stub(reportsService, "getById").rejects();

      await expect(reportsController.getById(req, res)).to.be.rejected;
    });
  });

  describe("getAll", () => {
    it("should return reports", async () => {
      const reports = [
        new ReportModel("example report 1", 0, 0, 1, 1),
        new ReportModel("example report 2", 1, 1, 1, 0.1),
      ];
      const resPromise = Promise.resolve(reports);
      const resBody = ExpressMockResponse.createJsonResponseBody(
        false,
        reports,
      );

      req.user = 1;
      req.officer = 0;

      const getAllReportsStub = sinon
        .stub(reportsService, "getAll")
        .resolves(resPromise);

      await reportsController.getAll(req, res);

      expect(getAllReportsStub)
        .to.be.calledOnceWithExactly(1)
        .returned(resPromise);

      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should pass null to reportsService when officer is true", async () => {
      const resPromise = Promise.resolve([]);

      req.user = 4;
      req.officer = 1;

      const getAllReportsStub = sinon
        .stub(reportsService, "getAll")
        .resolves(resPromise);

      await reportsController.getAll(req, res);

      expect(getAllReportsStub)
        .to.be.calledOnceWithExactly(null)
        .returned(resPromise);
    });

    it("should propagate errors", async () => {
      req.user = 1;
      req.officer = 0;

      const getAllReportsStub = sinon.stub(reportsService, "getAll").rejects();

      await expect(reportsController.getAll(req, res)).to.be.rejected;
      expect(getAllReportsStub).to.be.calledOnceWithExactly(1);
    });
  });

  describe("createWitness", () => {
    it("should add a witness to a report", async () => {
      const witness = new PersonalDetailsModel(
        "John",
        "Smith",
        "2000-12-12",
        "07432786432",
      );
      req.body = {
        first_name: witness.first_name,
        last_name: witness.last_name,
        date_of_birth: witness.date_of_birth,
        contact_number: witness.contact_number,
      };
      const witnessPromise = Promise.resolve(witness);
      const resBody = ExpressMockResponse.createJsonResponseBody(
        false,
        witness,
      );

      req.params = {
        id: 1,
      };

      sinon.stub(reportsService, "canModify").returns(Promise.resolve(true));

      const addWitnessStub = sinon
        .stub(personalDetailsService, "createReportWitness")
        .returns(witnessPromise);

      await reportsController.createWitness(req, res);

      expect(addWitnessStub)
        .to.be.calledOnceWithExactly(req.body, 1)
        .returned(witnessPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should throw if user lacks the permissions to edit a report", async () => {
      req.body = {
        first_name: "",
        last_name: "",
      };
      req.params = {
        id: 1,
      };

      sinon.stub(reportsService, "canModify").returns(Promise.resolve(false));

      const addWitnessStub = sinon
        .stub(personalDetailsService, "createReportWitness")
        .returns(null);

      await expect(reportsController.createWitness(req, res)).to.be.rejected;
      expect(addWitnessStub).to.not.be.calledOnceWithExactly(req.body, 1);
    });

    it("should propagate errors", async () => {
      req.body = {
        first_name: "",
        last_name: "",
      };
      req.params = {
        id: 1,
      };

      sinon.stub(reportsService, "canModify").returns(Promise.resolve(true));

      const addWitnessStub = sinon
        .stub(personalDetailsService, "createReportWitness")
        .rejects();

      await expect(reportsController.createWitness(req, res)).to.be.rejected;
      expect(addWitnessStub).to.be.calledOnceWithExactly(req.body, 1);
    });
  });

  describe("deleteWitness", () => {
    it("should delete a witness from a report", async () => {
      req.params = {
        reportId: 1,
        witnessId: 4,
      };
      const deletedWitnessPromise = Promise.resolve(true);

      const deleteWitnessStub = sinon
        .stub(personalDetailsService, "deleteReportWitness")
        .returns(deletedWitnessPromise);

      await reportsController.deleteWitness(req, res);

      expect(deleteWitnessStub)
        .to.be.calledOnceWithExactly(1, 4)
        .returned(deletedWitnessPromise);
      expect(res.statusCode).to.be.equal(204);
    });

    it("should return 404 when witness not found", async () => {
      req.params = {
        reportId: 1,
        witnessId: 5,
      };
      const deletedWitnessPromise = Promise.resolve(false);

      const deleteWitnessStub = sinon
        .stub(personalDetailsService, "deleteReportWitness")
        .returns(deletedWitnessPromise);

      await reportsController.deleteWitness(req, res);

      expect(deleteWitnessStub)
        .to.be.calledOnceWithExactly(1, 5)
        .returned(deletedWitnessPromise);
      expect(res.statusCode).to.be.equal(404);
    });

    it("should propagate errors", async () => {
      req.params = {
        reportId: 1,
        witnessId: 4,
      };

      const deleteWitnessStub = sinon
        .stub(personalDetailsService, "deleteReportWitness")
        .rejects();

      await expect(reportsController.deleteWitness(req, res)).to.be.rejected;
      expect(deleteWitnessStub).to.be.calledOnceWithExactly(1, 4);
    });
  });

  describe("updateStatus", () => {
    it("should update report status", async () => {
      const report = new ReportModel("example description", 0, 0, 1, 1);
      report.status = "IN-PROGRESS";
      const resPromise = Promise.resolve(report);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, report);

      req.params = {
        id: 1,
      };
      req.officer = 1;
      req.body = {
        status: "IN-PROGRESS",
      };

      const updateStatusStub = sinon
        .stub(reportsService, "updateStatus")
        .returns(resPromise);

      await reportsController.updateStatus(req, res);

      expect(updateStatusStub)
        .to.be.calledOnceWithExactly(1, req.body)
        .returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should throw if user is not a officer", async () => {
      const resPromise = Promise.resolve(null);

      req.params = {
        id: 1,
      };
      req.officer = 0;

      const updateStatusStub = sinon
        .stub(reportsService, "updateStatus")
        .returns(resPromise);

      await expect(reportsController.updateStatus(req, res)).to.be.rejected;

      expect(updateStatusStub).to.not.be.called;
    });

    it("should propagate errors", async () => {
      it("should throw if user is not a officer", async () => {
        req.params = {
          id: 1,
        };
        req.officer = 0;
        req.body = {
          status: "IN-PROGRESS",
        };

        const updateStatusStub = sinon
          .stub(reportsService, "updateStatus")
          .rejects();

        await expect(reportsController.updateStatus(req, res)).to.be.rejected;

        expect(updateStatusStub).to.be.calledOnceWithExactly(1, req.body);
      });
    });
  });

  describe("delete", () => {
    it("should delete a report", async () => {
      req.params = {
        id: 1,
      };
      req.officer = 1;

      const deleteReportStub = sinon.stub(reportsService, "delete");

      await reportsController.delete(req, res);

      expect(deleteReportStub).to.be.calledOnceWithExactly(1);
      expect(res.statusCode).to.be.equal(204);
      expect(res.get("Content-Type")).to.be.equal("text/plain");
    });

    it("should throw if user is not a officer", async () => {
      req.params = {
        id: 1,
      };
      req.officer = 0;

      const deleteReportStub = sinon.stub(reportsService, "delete");

      await expect(reportsController.delete(req, res)).to.be.rejected;
      expect(deleteReportStub).to.not.be.called;
    });

    it("should propagate errors", async () => {
      req.params = {
        id: 1,
      };
      req.officer = 1;

      const deleteReportStub = sinon.stub(reportsService, "delete").rejects();

      await expect(reportsController.delete(req, res)).to.be.rejected;
      expect(deleteReportStub).to.be.calledOnceWithExactly(1);
    });
  });
});
