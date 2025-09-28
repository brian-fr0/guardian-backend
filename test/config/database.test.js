const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const chaiAsPromised = require("chai-as-promised").default;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { expect } = chai;

const sqlite3 = require("sqlite3");
const nodeEnvOrignal = process.env.NODE_ENV;
process.env.NODE_ENV = "test";

const { run, all, withTransaction, get } = require("../../src/config/database");

describe("database config", async () => {
  beforeEach(async () => {
    await run("DROP TABLE IF EXISTS books;");
    await run("DROP TABLE IF EXISTS authors;");

    await run(
      "CREATE TABLE books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, author_id INTEGER);",
    );
    await run(
      "CREATE TABLE authors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);",
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  after(() => {
    process.env.NODE_ENV = nodeEnvOrignal;
  });

  describe("run", () => {
    it("should run a statment and return a promise", async () => {
      const runSpy = sinon.spy(sqlite3.Database.prototype, "run");

      const addAuthor = await run(
        "INSERT INTO authors (name) VALUES (?);",
        "John",
      );

      expect(runSpy).to.have.been.calledWith(
        "INSERT INTO authors (name) VALUES (?);",
      );
      expect(addAuthor.lastID).to.be.equal(1);
    });

    it("should propagate errors", async () => {
      await expect(run("INSERT INTO authors", "John")).to.be.rejected;
    });
  });

  describe("get", () => {
    it("should run a query and return a promise for the results", async () => {
      await run("INSERT INTO authors (name) VALUES (?);", "John");
      const author = await get("SELECT * from authors WHERE id = ?", [1]);

      expect(author.id).to.be.equal(1);
    });

    it("should propagate errors", async () => {
      await expect(get("SELECT * FROM")).to.be.rejected;
    });
  });

  describe("all", () => {
    it("should run a query and return a promise for the results", async () => {
      await run("INSERT INTO authors (name) VALUES (?);", "John");
      await run("INSERT INTO authors (name) VALUES (?);", "Paul");

      const authors = await all("SELECT * from authors;");

      expect(Array.isArray(authors)).to.be.true;
      expect(authors).to.be.lengthOf(2);
    });

    it("should propagate errors", async () => {
      await expect(get("SELECT * FROM")).to.be.rejected;
    });
  });

  describe("withTransaction", () => {
    it("should commit transaction", async () => {
      await expect(
        withTransaction(async () => {
          await run("INSERT INTO authors (name) VALUES (?);", "John");
          await run("INSERT INTO books (title, author_id) VALUES (?, ?);", [
            "Scary Story 01",
            1,
          ]);
        }),
      ).to.not.be.rejected;

      const authors = await all("SELECT * FROM authors;");
      const books = await all("SELECT * FROM books;");

      expect(Array.isArray(authors)).to.be.true;
      expect(Array.isArray(books)).to.be.true;

      expect(authors).to.be.lengthOf(1);
      expect(books).to.be.lengthOf(1);
    });

    it("should commit multiple transactions", async () => {
      await expect(
        withTransaction(async () => {
          await run("INSERT INTO authors (name) VALUES (?);", "Mike");
          await run("INSERT INTO books (title, author_id) VALUES (?, ?);", [
            "Scary Story 01",
            1,
          ]);
        }),
      ).to.not.be.rejected;

      await expect(
        withTransaction(async () => {
          await run("INSERT INTO authors (name) VALUES (?);", "John");
          await run("INSERT INTO books (title, author_id) VALUES (?, ?);", [
            "Scary Story 02",
            2,
          ]);
        }),
      ).to.not.be.rejected;

      const authors = await all("SELECT * FROM authors;");
      const books = await all("SELECT * FROM books;");

      expect(Array.isArray(authors)).to.be.true;
      expect(Array.isArray(books)).to.be.true;

      expect(authors).to.be.lengthOf(2);
      expect(books).to.be.lengthOf(2);
    });

    it("should rollback when a statment throws", async () => {
      const runSpy = sinon.spy(sqlite3.Database.prototype, "run");

      try {
        await withTransaction(async () => {
          await run("INSERT INTO authors (name) VALUES (?);", "John");
          await run("INSERT INTO books");
        });
      } catch {}

      const authors = await all("SELECT * FROM authors;");
      const books = await all("SELECT * FROM books;");

      expect(Array.isArray(authors)).to.be.true;
      expect(Array.isArray(books)).to.be.true;

      expect(authors).to.be.lengthOf(0);
      expect(books).to.be.lengthOf(0);

      expect(runSpy.getCall(3)).to.have.been.calledWith("ROLLBACK");
    });

    it("should commit transaction after previous transaction failed", async () => {
      try {
        await withTransaction(async () => {
          await run("INSERT INTO authors (name) VALUES (?);", "John");
          await run("INSERT INTO books");
        });
      } catch {}

      await expect(
        withTransaction(async () => {
          await run("INSERT INTO authors (name) VALUES (?);", "John");
          await run("INSERT INTO books (title, author_id) VALUES (?, ?);", [
            "Scary Story 01",
            1,
          ]);
        }),
      ).to.not.be.rejected;

      const authors = await all("SELECT * FROM authors;");
      const books = await all("SELECT * FROM books;");

      expect(Array.isArray(authors)).to.be.true;
      expect(Array.isArray(books)).to.be.true;

      expect(authors).to.be.lengthOf(1);
      expect(books).to.be.lengthOf(1);
    });

    it("should propagate errors", async () => {
      await expect(
        withTransaction(async () => {
          await run("INSERT INTO authors (name) VALUES (?);", "John");
          await run("INSERT INTO books");
        }),
      ).to.be.rejected;
    });
  });
});
