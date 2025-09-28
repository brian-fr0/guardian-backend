const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const ExpressMockRequest = require("../testing-utils/expressRequest");
const ExpressMockResponse = require("test/testing-utils/expressResponse");
const AlertModel = require("src/models/alert.model");
const NoteModel = require("src/models/note.model");
const notesService = require("src/services/notes.service");
const notesController = require("src/controllers/notes.controller");
const chaiAsPromised = require("chai-as-promised").default;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("NotesController", () => {
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

  describe("createResource", () => {
    it("should create new note", async () => {
      const note = new NoteModel(
        "Example subject",
        "Example content",
        1,
        "report",
      );
      const resPromise = Promise.resolve(note);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, note);

      req.body = {
        subject: note.subject,
        content: note.content,
      };

      req.query = {
        resourceType: "report",
      };

      req.params = {
        resourceId: 1,
      };

      const createNoteStub = sinon
        .stub(notesService, "resourceCreate")
        .returns(resPromise);

      await notesController.resourceCreate(req, res);

      expect(createNoteStub)
        .to.be.calledOnceWithExactly({
          ...req.body,
          resource_id: req.params.resourceId,
          resource_type: req.query.resourceType,
        })
        .returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should propagate errors", async () => {
      req.body = {
        subject: "",
        content: "",
      };
      req.query = {
        resourceType: "report",
      };

      req.params = {
        resourceId: 1,
      };

      const createNoteStub = sinon
        .stub(notesService, "resourceCreate")
        .rejects();

      await expect(notesController.resourceCreate(req, res)).to.be.rejected;
      expect(createNoteStub).to.be.calledOnceWithExactly({
        ...req.body,
        resource_id: req.params.resourceId,
        resource_type: req.query.resourceType,
      });
    });
  });

  describe("all", () => {
    it("should return all notes for a resource", async () => {
      const notes = [new NoteModel("Example subject", "Example content", 1)];
      const resPromise = Promise.resolve(notes);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, notes);

      req.params = {
        resourceId: 1,
      };
      req.query = {
        resourceType: "report",
      };
      req.user = 1;
      req.officer = 0;

      const getAllResourceNotesStub = sinon
        .stub(notesService, "resourceGetAll")
        .returns(resPromise);

      await notesController.resourceGetAll(req, res);

      expect(getAllResourceNotesStub)
        .to.be.calledOnceWithExactly({
          ...req.query,
          ...req.params,
          userId: req.user,
          officer: req.officer === 1,
        })
        .returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should propagate errors", async () => {
      sinon.stub(notesService, "resourceGetAll").rejects();
      await expect(notesController.resourceGetAll(req, res)).to.be.rejected;
    });
  });

  describe("getById", () => {
    it("should get note by id", async () => {
      const note = new NoteModel("Example subject", "Example content", 1);
      const resPromise = Promise.resolve(note);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, note);

      req.params = {
        noteId: 1,
      };
      req.user = 1;

      const getByIdStub = sinon
        .stub(notesService, "getById")
        .returns(resPromise);

      await notesController.getById(req, res);

      expect(getByIdStub)
        .to.be.calledOnceWithExactly(1, 1)
        .returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should return 404 when no alert found", async () => {
      const resPromise = Promise.resolve(null);

      req.params = {
        noteId: 2,
      };
      req.user = 1;

      const getByIdStub = sinon
        .stub(notesService, "getById")
        .returns(resPromise);

      await notesController.getById(req, res);

      expect(getByIdStub)
        .to.be.calledOnceWithExactly(2, 1)
        .returned(resPromise);
      expect(res.statusCode).to.be.equal(404);
    });

    it("should propagate errors", async () => {
      req.params = {
        noteId: 1,
      };
      req.user = 1;

      const getByIdStub = sinon.stub(notesService, "getById").rejects();

      await expect(notesController.getById(req, res)).to.be.rejected;
      expect(getByIdStub).to.be.calledOnceWithExactly(1, 1);
    });
  });

  describe("updateById", () => {
    it("should update note", async () => {
      const note = new NoteModel("Example subject", "Example content", 1);
      const resPromise = Promise.resolve(note);
      const resBody = ExpressMockResponse.createJsonResponseBody(false, note);

      req.params = {
        noteId: 1,
      };
      req.user = 1;
      req.body = {
        subject: note.subject,
        content: note.content,
      };

      const updateByIdStub = sinon
        .stub(notesService, "updateById")
        .returns(resPromise);

      await notesController.updateById(req, res);

      expect(updateByIdStub)
        .to.be.calledOnceWithExactly(1, req.body, 1)
        .returned(resPromise);
      expect(res.body).to.be.deep.equal(resBody);
    });

    it("should return 404 when no alert found", async () => {
      const note = new NoteModel("Example subject", "Example content", 1);
      const resPromise = Promise.resolve(null);

      req.params = {
        noteId: 2,
      };
      req.user = 1;
      req.body = {
        subject: note.subject,
        content: note.content,
      };

      const updateByIdStub = sinon
        .stub(notesService, "updateById")
        .returns(resPromise);

      await notesController.updateById(req, res);

      expect(updateByIdStub)
        .to.be.calledOnceWithExactly(2, req.body, 1)
        .returned(resPromise);
      expect(res.statusCode).to.be.equal(404);
    });

    it("should propagate errors", async () => {
      const note = new NoteModel("Example subject", "Example content", 1);
      req.params = {
        noteId: 1,
      };
      req.user = 1;
      req.body = {
        subject: note.subject,
        content: note.content,
      };

      const updateByIdStub = sinon.stub(notesService, "updateById").rejects();

      await expect(notesController.updateById(req, res)).to.be.rejected;
      expect(updateByIdStub).to.be.calledOnceWithExactly(1, req.body, 1);
    });
  });

  describe("deleteById", () => {
    it("should delete note by id", async () => {
      const resPromise = Promise.resolve(true);

      req.params = {
        noteId: 1,
      };

      const deleteByIdStub = sinon
        .stub(notesService, "deleteById")
        .returns(resPromise);

      await notesController.deleteById(req, res);

      expect(deleteByIdStub)
        .to.be.calledOnceWithExactly(1)
        .returned(resPromise);
      expect(res.statusCode).to.be.equal(204);
    });

    it("should return 404 when no alert found to delete", async () => {
      const resPromise = Promise.resolve(false);

      req.params = {
        noteId: 1,
      };

      const deleteByIdStub = sinon
        .stub(notesService, "deleteById")
        .returns(resPromise);

      await notesController.deleteById(req, res);

      expect(deleteByIdStub)
        .to.be.calledOnceWithExactly(1)
        .returned(resPromise);
      expect(res.statusCode).to.be.equal(404);
    });

    it("should propagate errors", async () => {
      req.params = {
        noteId: 1,
      };

      const deleteByIdStub = sinon.stub(notesService, "deleteById").rejects();

      await expect(notesController.deleteById(req, res)).to.be.rejected;
      expect(deleteByIdStub).to.be.calledOnceWithExactly(1);
    });
  });

  // describe("create", () => {
  //   it("should create new alert", async () => {
  //     const alert = new AlertModel(
  //       "example alert",
  //       "example description",
  //       "Example Type",
  //     );
  //     const resPromise = Promise.resolve(alert);
  //     const resBody = ExpressMockResponse.createJsonResponseBody(false, alert);
  //
  //     req.body = {
  //       title: alert.title,
  //       description: alert.description,
  //       type: alert.type,
  //     };
  //
  //     const createAlertStub = sinon
  //       .stub(alertsService, "create")
  //       .returns(resPromise);
  //
  //     await alertsController.create(req, res);
  //
  //     expect(createAlertStub)
  //       .to.be.calledOnceWithExactly(req.body)
  //       .returned(resPromise);
  //     expect(res.body).to.be.deep.equal(resBody);
  //   });
  //
  //   it("should propagate errors", async () => {
  //     req.body = {
  //       title: "",
  //       description: "",
  //       type: "",
  //     };
  //
  //     const createAlertStub = sinon.stub(alertsService, "create").rejects();
  //
  //     await expect(alertsController.create(req, res)).to.be.rejected;
  //     expect(createAlertStub).to.be.calledOnceWithExactly(req.body);
  //   });
  // });
  //
  // describe("getById", () => {
  //   it("should get alert by id", async () => {
  //     const alert = new AlertModel(
  //       "example alert",
  //       "example description",
  //       "Example Type",
  //     );
  //     const resPromise = Promise.resolve(alert);
  //     const resBody = ExpressMockResponse.createJsonResponseBody(false, alert);
  //
  //     req.params = {
  //       alertId: 1,
  //     };
  //
  //     const getByIdStub = sinon
  //       .stub(alertsService, "getById")
  //       .returns(resPromise);
  //
  //     await alertsController.getById(req, res);
  //
  //     expect(getByIdStub).to.be.calledOnceWithExactly(1).returned(resPromise);
  //     expect(res.body).to.be.deep.equal(resBody);
  //   });
  //
  //   it("should return 404 when no alert found", async () => {
  //     const resPromise = Promise.resolve(null);
  //
  //     req.params = {
  //       alertId: 1,
  //     };
  //
  //     const getByIdStub = sinon
  //       .stub(alertsService, "getById")
  //       .returns(resPromise);
  //
  //     await alertsController.getById(req, res);
  //
  //     expect(getByIdStub).to.be.calledOnceWithExactly(1).returned(resPromise);
  //     expect(res.statusCode).to.be.equal(404);
  //   });
  //
  //   it("should propagate errors", async () => {
  //     req.params = {
  //       alertId: 1,
  //     };
  //
  //     const getByIdStub = sinon.stub(alertsService, "getById").rejects();
  //
  //     await expect(alertsController.getById(req, res)).to.be.rejected;
  //     expect(getByIdStub).to.be.calledOnceWithExactly(1);
  //   });
  // });
  //
  // describe("deleteById", () => {
  //   it("should delete alert by id", async () => {
  //     const resPromise = Promise.resolve(true);
  //
  //     req.params = {
  //       alertId: 1,
  //     };
  //
  //     const deleteByIdStub = sinon
  //       .stub(alertsService, "deleteById")
  //       .returns(resPromise);
  //
  //     await alertsController.deleteById(req, res);
  //
  //     expect(deleteByIdStub)
  //       .to.be.calledOnceWithExactly(1)
  //       .returned(resPromise);
  //     expect(res.statusCode).to.be.equal(204);
  //   });
  //
  //   it("should return 404 when no alert found to delete", async () => {
  //     const resPromise = Promise.resolve(false);
  //
  //     req.params = {
  //       alertId: 1,
  //     };
  //
  //     const deleteByIdStub = sinon
  //       .stub(alertsService, "deleteById")
  //       .returns(resPromise);
  //
  //     await alertsController.deleteById(req, res);
  //
  //     expect(deleteByIdStub)
  //       .to.be.calledOnceWithExactly(1)
  //       .returned(resPromise);
  //     expect(res.statusCode).to.be.equal(404);
  //   });
  //
  //   it("should propagate errors", async () => {
  //     req.params = {
  //       alertId: 1,
  //     };
  //
  //     const deleteByIdStub = sinon.stub(alertsService, "deleteById").rejects();
  //
  //     await expect(alertsController.deleteById(req, res)).to.be.rejected;
  //     expect(deleteByIdStub).to.be.calledOnceWithExactly(1);
  //   });
  // });
});
