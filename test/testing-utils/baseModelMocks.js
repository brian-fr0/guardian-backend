const chai = require("chai");
const sinon = require("sinon");
const BaseModel = require("../../src/models/base.model");
const sinonChai = require("sinon-chai").default;

chai.use(sinonChai);

/**
 * @typedef {Object} BaseModelStubs
 * @property {sinon.SinonStub} init
 * @property {sinon.SinonStub} save
 * @property {sinon.SinonStub} delete
 * @property {sinon.SinonStub} deleteWhere
 * @property {sinon.SinonStub} findById
 * @property {sinon.SinonStub} findBy
 * @property {sinon.SinonStub} all
 * @property {sinon.SinonStub} findAllBy
 * @property {sinon.SinonStub} allRaw
 * @property {sinon.SinonStub} getRaw
 */

/**
 * @returns {BaseModelStubs}
 */
function setupBaseModelStubs() {
  const stubs = {};

  stubs.init = sinon.stub(BaseModel, "initialize");
  stubs.save = sinon.stub(BaseModel.prototype, "save").callsFake(function () {
    return this;
  });
  stubs.delete = sinon
    .stub(BaseModel.prototype, "delete")
    .callsFake(function () {
      return this;
    });
  stubs.deleteWhere = sinon.stub(BaseModel, "deleteWhere").resolves(null);
  stubs.findById = sinon.stub(BaseModel, "findById").resolves(null);
  stubs.findBy = sinon.stub(BaseModel, "findBy").resolves(null);
  stubs.all = sinon.stub(BaseModel, "all").resolves([]);
  stubs.findAllBy = sinon.stub(BaseModel, "findAllBy").resolves([]);
  stubs.allRaw = sinon.stub(BaseModel, "allRaw").resolves(null);
  stubs.getRaw = sinon.stub(BaseModel, "getRaw").resolves(null);

  return stubs;
}

module.exports = setupBaseModelStubs;
