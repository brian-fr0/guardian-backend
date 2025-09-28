const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai").default;
const { expect } = chai;
chai.use(sinonChai);

const AppError = require("../../src/utils/app-error");
const defaultLogger = require("../../src/config/logging");

describe("AppError", () => {
  let loggerStub;

  beforeEach(() => {
    loggerStub = sinon.stub(defaultLogger, "log");
  });

  afterEach(() => {
    loggerStub.resetHistory();
    sinon.restore();
  });

  describe("AppError.log", () => {
    it("should log error only", () => {
      const error = new Error("Operation Failed");
      AppError.log(error);

      expect(loggerStub).to.have.been.calledOnce;
      const logged = loggerStub.firstCall.args[0];
      expect(logged).to.include({
        level: "error",
        name: error.name,
        message: error.message,
      });
    });

    it("should log error and request id", () => {
      const error = new Error("Operation Failed");
      AppError.log(error, 1);

      expect(loggerStub).to.have.been.calledOnce;
      const logged = loggerStub.firstCall.args[0];
      expect(logged).to.include({
        level: "error",
        name: error.name,
        message: error.message,
        id: 1,
      });
    });
  });

  describe("AppError.handleError", () => {
    it("should handle error only", () => {
      const stub = sinon.spy(AppError, "handleError");

      const error = new Error("Operation Failed");
      AppError.handleError(error);

      expect(stub).to.have.been.calledOnce;
      expect(stub).to.have.been.calledWith(error);
      expect(loggerStub).to.have.been.calledOnce;
      const logged = loggerStub.firstCall.args[0];
      expect(logged).to.include({
        level: "error",
        name: error.name,
        message: error.message,
      });
    });

    it("should handle error and request id", () => {
      const stub = sinon.spy(AppError, "handleError");

      const error = new Error("Operation Failed");
      AppError.handleError(error, 1);

      expect(stub).to.have.been.calledOnce;
      expect(stub).to.have.been.calledWith(error, 1);
      expect(loggerStub).to.have.been.calledOnce;
      const logged = loggerStub.firstCall.args[0];
      expect(logged).to.include({
        level: "error",
        name: error.name,
        message: error.message,
        id: 1,
      });
    });
  });

  describe("AppError.try", () => {
    it("Take a asynchronous function that throws, and catches the error and logs it", async () => {
      const handleErrorSpy = sinon.spy(AppError, "handleError");

      const error = new Error("Operation Error");

      async function throwingFunction() {
        return Promise.reject(error);
      }

      await AppError.try(throwingFunction);

      expect(handleErrorSpy).to.have.been.calledOnceWithExactly(error);
      expect(loggerStub).to.have.been.calledOnce;
      const logged = loggerStub.firstCall.args[0];
      expect(logged).to.include({
        level: "error",
        name: error.name,
        message: error.message,
      });
    });

    it("Take a asynchronous function that calls a function and throws, and catches the error and logs it", async () => {
      const handleErrorSpy = sinon.spy(AppError, "handleError");

      const error = new Error("Operation Error");

      async function throwingFunction() {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(error);
          }, 0);
        });
      }

      await AppError.try(async () => {
        await throwingFunction();
      });

      expect(handleErrorSpy).to.have.been.calledOnceWithExactly(error);
      expect(loggerStub).to.have.been.calledOnce;
      const logged = loggerStub.firstCall.args[0];
      expect(logged).to.include({
        level: "error",
        name: error.name,
        message: error.message,
      });
    });

    it("Take a asynchronous function does not throw, should do nothing", async () => {
      const handleErrorSpy = sinon.spy(AppError, "handleError");

      async function nonThrowingFunction() {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 0);
        });
      }

      await AppError.try(nonThrowingFunction);

      expect(handleErrorSpy).to.not.have.been.called;
      expect(loggerStub).to.not.have.been.called;
    });
  });

  describe("AppError.trySync", () => {
    it("Take a synchronous function that throws, and catches the error and logs it", () => {
      const handleErrorSpy = sinon.spy(AppError, "handleError");

      const error = new Error("Operation Error");

      function throwingFunction() {
        throw error;
      }

      AppError.trySync(throwingFunction);

      expect(handleErrorSpy).to.have.been.calledOnceWithExactly(error);
      expect(loggerStub).to.have.been.calledOnce;
      const logged = loggerStub.firstCall.args[0];
      expect(logged).to.include({
        level: "error",
        name: error.name,
        message: error.message,
      });
    });

    it("Take a synchronous function that calls a function and throws, and catches the error and logs it", () => {
      const handleErrorSpy = sinon.spy(AppError, "handleError");

      const error = new Error("Operation Error");

      function throwingFunction() {
        throw error;
      }

      AppError.trySync(() => {
        throwingFunction();
      });

      expect(handleErrorSpy).to.have.been.calledOnceWithExactly(error);
      expect(loggerStub).to.have.been.calledOnce;
      const logged = loggerStub.firstCall.args[0];
      expect(logged).to.include({
        level: "error",
        name: error.name,
        message: error.message,
      });
    });

    it("Take a synchronous function does not throw, should do nothing", () => {
      const handleErrorSpy = sinon.spy(AppError, "handleError");

      AppError.trySync(() => {});

      expect(handleErrorSpy).to.not.have.been.called;
      expect(loggerStub).to.not.have.been.called;
    });
  });
});
