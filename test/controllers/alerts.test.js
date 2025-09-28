const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const ExpressMockRequest = require("../testing-utils/expressRequest");
const ExpressMockResponse = require("test/testing-utils/expressResponse");
const AlertModel = require("src/models/alert.model");
const alertsService = require("src/services/alerts.service");
const alertsController = require("src/controllers/alerts.controller");
const chaiAsPromised = require("chai-as-promised").default;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("AlertsController", () => {
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

  describe("all", () => {
    it("should return all alerts", async () => {
      const alerts = [
        new AlertModel("example alert", "example description", "Example Type"),
      ];
      const resPromise = Promise.resolve(alerts);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, alerts);

      const getAllAlertsStub = sinon
        .stub(alertsService, "all")
        .returns(resPromise);

      await alertsController.all(req, res);

      expect(getAllAlertsStub).to.be.calledOnce.returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should pass page number to alertsService.all", async () => {
      const alerts = [];
      const resPromise = Promise.resolve(alerts);

      req.query = {
        page: 2,
      };

      const getAllAlertsStub = sinon
        .stub(alertsService, "all")
        .returns(resPromise);

      await alertsController.all(req, res);

      expect(getAllAlertsStub)
        .to.be.calledOnceWithExactly(20, 2)
        .returned(resPromise);
    });

    it("should propagate errors", async () => {
      sinon.stub(alertsService, "all").rejects();
      await expect(alertsController.all(req, res)).to.be.rejected;
    });
  });

  describe("create", () => {
    it("should create new alert", async () => {
      const alert = new AlertModel(
        "example alert",
        "example description",
        "Example Type",
      );
      const resPromise = Promise.resolve(alert);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, alert);

      req.body = {
        title: alert.title,
        description: alert.description,
        type: alert.type,
      };

      const createAlertStub = sinon
        .stub(alertsService, "create")
        .returns(resPromise);

      await alertsController.create(req, res);

      expect(createAlertStub)
        .to.be.calledOnceWithExactly(req.body)
        .returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should propagate errors", async () => {
      req.body = {
        title: "",
        description: "",
        type: "",
      };

      const createAlertStub = sinon.stub(alertsService, "create").rejects();

      await expect(alertsController.create(req, res)).to.be.rejected;
      expect(createAlertStub).to.be.calledOnceWithExactly(req.body);
    });
  });

  describe("getById", () => {
    it("should get alert by id", async () => {
      const alert = new AlertModel(
        "example alert",
        "example description",
        "Example Type",
      );
      const resPromise = Promise.resolve(alert);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, alert);

      req.params = {
        alertId: 1,
      };

      const getByIdStub = sinon
        .stub(alertsService, "getById")
        .returns(resPromise);

      await alertsController.getById(req, res);

      expect(getByIdStub).to.be.calledOnceWithExactly(1).returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should return 404 when no alert found", async () => {
      const resPromise = Promise.resolve(null);

      req.params = {
        alertId: 1,
      };

      const getByIdStub = sinon
        .stub(alertsService, "getById")
        .returns(resPromise);

      await alertsController.getById(req, res);

      expect(getByIdStub).to.be.calledOnceWithExactly(1).returned(resPromise);
      expect(res.statusCode).to.be.equal(404);
    });

    it("should propagate errors", async () => {
      req.params = {
        alertId: 1,
      };

      const getByIdStub = sinon.stub(alertsService, "getById").rejects();

      await expect(alertsController.getById(req, res)).to.be.rejected;
      expect(getByIdStub).to.be.calledOnceWithExactly(1);
    });
  });

  describe("deleteById", () => {
    it("should delete alert by id", async () => {
      const resPromise = Promise.resolve(true);

      req.params = {
        alertId: 1,
      };

      const deleteByIdStub = sinon
        .stub(alertsService, "deleteById")
        .returns(resPromise);

      await alertsController.deleteById(req, res);

      expect(deleteByIdStub)
        .to.be.calledOnceWithExactly(1)
        .returned(resPromise);
      expect(res.statusCode).to.be.equal(204);
    });

    it("should return 404 when no alert found to delete", async () => {
      const resPromise = Promise.resolve(false);

      req.params = {
        alertId: 1,
      };

      const deleteByIdStub = sinon
        .stub(alertsService, "deleteById")
        .returns(resPromise);

      await alertsController.deleteById(req, res);

      expect(deleteByIdStub)
        .to.be.calledOnceWithExactly(1)
        .returned(resPromise);
      expect(res.statusCode).to.be.equal(404);
    });

    it("should propagate errors", async () => {
      req.params = {
        alertId: 1,
      };

      const deleteByIdStub = sinon.stub(alertsService, "deleteById").rejects();

      await expect(alertsController.deleteById(req, res)).to.be.rejected;
      expect(deleteByIdStub).to.be.calledOnceWithExactly(1);
    });
  });
});
