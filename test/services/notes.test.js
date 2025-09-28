require("dotenv").config();
const chai = require("chai");
const sinon = require("sinon");
const setupBaseModelStubs = require("../testing-utils/baseModelMocks");
const { ZodError } = require("zod");
const notesService = require("src/services/notes.service");
const NoteModel = require("src/models/note.model");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

describe("NotesService", function () {
  /** @type {import("../testing-utils/baseModelMocks").BaseModelStubs} */
  let baseModelStubs;

  beforeEach(() => {
    baseModelStubs = setupBaseModelStubs();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("createResource", () => {
    it("should create a note", async () => {
      const body = {
        subject: "Example subject",
        content: "Example content",
        resource_id: 1,
        resource_type: "report",
      };

      const note = await notesService.resourceCreate(body);

      expect(note).to.have.property("subject");
      expect(note).to.have.property("content");
      expect(note).to.have.property("resource_id");
      expect(note).to.have.property("resource_type");
    });

    it("should throw zod errors", async () => {
      const body = {
        subject: "Example subject",
        content: "Example content",
        resource_id: 4,
        resource_type: 1,
      };

      await expect(notesService.resourceCreate(body)).to.be.rejected.then(
        (err) => {
          expect(err).to.be.instanceOf(ZodError);
        },
      );
    });

    it("should propagate errors", async () => {
      const body = {
        subject: "Example subject",
        content: "Example content",
        resource_id: "4",
        resource_type: "report",
      };

      baseModelStubs.save.rejects();

      await expect(notesService.resourceCreate(body)).to.be.rejected;
    });
  });

  describe("resourceGetAll", () => {
    it("should return found notes", async () => {
      const notes = [
        new NoteModel("Example subject", "Example content", 1, "report"),
      ];
      baseModelStubs.allRaw.resolves(notes);

      const notesFound = await notesService.resourceGetAll({
        resourceId: 1,
        resourceType: "report",
        userId: 1,
      });

      expect(Array.isArray(notesFound)).to.be.true;
    });

    it("should propagate errors", async () => {
      baseModelStubs.allRaw.rejects();

      await expect(notesService.resourceGetAll(2)).to.be.rejected;
    });
  });

  describe("getById", () => {
    it("should return found note", async () => {
      const note = new NoteModel(
        "Example subject",
        "Example content",
        1,
        "report",
      );
      baseModelStubs.getRaw.resolves(note);

      const result = await notesService.getById(1);

      expect(result).to.have.property("subject");
      expect(result).to.have.property("content");
    });

    it("should return null when no note found", async () => {
      const result = await notesService.getById(1);

      expect(result).to.be.null;
    });

    it("should throw if alertId missing", async () => {
      await expect(notesService.getById()).to.be.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.getRaw.rejects();

      await expect(notesService.getById(1)).to.be.rejected;
    });
  });

  describe("updateById", () => {
    it("should update a note", async () => {
      const note = new NoteModel(
        "Example subject",
        "Example content",
        1,
        "report",
      );
      const body = {
        subject: "Example subject update",
        content: "Example content update",
      };

      baseModelStubs.findById.resolves(note);

      const updatedNote = await notesService.updateById(1, body);

      expect(updatedNote).to.have.property("subject");
      expect(updatedNote.subject).to.be.equal(body.subject);
      expect(updatedNote).to.have.property("content");
      expect(updatedNote.content).to.be.equal(body.content);
    });

    it("should throw zod errors", async () => {
      const body = {
        subject: "Example subject",
        content: 4,
      };

      await expect(notesService.updateById(1, body)).to.be.rejected.then(
        (err) => {
          expect(err).to.be.instanceOf(ZodError);
        },
      );
    });

    it("should propagate errors", async () => {
      const body = {
        subject: "Example subject",
        content: "Example content",
      };

      baseModelStubs.save.rejects();

      await expect(notesService.updateById(1, body)).to.be.rejected;
    });
  });

  describe("deleteById", () => {
    it("should delete note and return true", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 1 });

      const deleted = await notesService.deleteById(1);

      expect(deleted).to.be.true;
    });

    it("should return false if note not found", async () => {
      baseModelStubs.deleteWhere.resolves({ lastID: 0, changes: 0 });

      const deleted = await notesService.deleteById(1);

      expect(deleted).to.be.false;
    });

    it("should throw if noteId missing", async () => {
      await expect(notesService.deleteById()).to.be.rejected;
    });

    it("should propagate errors", async () => {
      baseModelStubs.deleteWhere.rejects();

      await expect(notesService.deleteById(1)).to.rejected;
    });
  });
});
