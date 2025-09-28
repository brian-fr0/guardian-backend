const personalDetailsService = require("../services/personal-details.service");
const reportsService = require("../services/reports.service");
const authenticationService = require("../services/authentication.service");
const HttpError = require("../utils/http-error");
const HttpResponse = require("../utils/http-response-helper");
const { logAudit } = require("../lib/audit"); 

class ReportsController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    const report = await reportsService.create(req.files, req.body, req.user);

    // audit: incident created
    try {
      logAudit(req, {
        action: "incident.create",
        entity: "incident",
        entityId: String(report?.id ?? ""),
        meta: {
          // keep it minimal, no PII
          attachments:
            Array.isArray(req.files)
              ? req.files.length
              : (req.files && Object.keys(req.files).length) || 0,
        },
      });
    } catch {}

    new HttpResponse(200, report).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getById(req, res) {
    const id = req.params.id;
    const report = await reportsService.getById(id);

    if (!report) {
      return new HttpResponse(404).sendStatus(res);
    }

    const canUserViewReport = await reportsService.canUserView(
      report,
      req.user,
    );
    if (!canUserViewReport) {
      return new HttpResponse(401).sendStatus(res);
    }

    new HttpResponse(200, report).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getAll(req, res) {
    const reports = await reportsService.getAll(req.officer ? null : req.user);
    new HttpResponse(200, reports).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async createWitness(req, res) {
    const id = req.params.id;
    const canModifyReport = await reportsService.canModify(id, req.user);

    if (!canModifyReport) {
      throw new HttpError({ code: 401 });
    }

    const witness = await personalDetailsService.createReportWitness(
      req.body,
      id,
    );

    // audit: witness added
    try {
      logAudit(req, {
        action: "incident.witness_add",
        entity: "incident",
        entityId: String(id),
        meta: { witnessId: String(witness?.id ?? "") },
      });
    } catch {}

    new HttpResponse(200, witness).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async deleteWitness(req, res) {
    const { reportId, witnessId } = req.params;

    const deleted = await personalDetailsService.deleteReportWitness(
      reportId,
      witnessId,
    );

    if (!deleted) {
      return new HttpResponse(404).sendStatus(res);
    }

    // audit: witness removed
    try {
      logAudit(req, {
        action: "incident.witness_delete",
        entity: "incident",
        entityId: String(reportId),
        meta: { witnessId: String(witnessId) },
      });
    } catch {}

    new HttpResponse(204).sendStatus(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateStatus(req, res) {
    const { id } = req.params;
    if (!req.officer) {
      throw new HttpError({ code: 401 });
    }

    // grab old status for audit meta
    let before = null;
    try {
      before = await reportsService.getById(id);
    } catch {}

    const report = await reportsService.updateStatus(id, req.body);

    // audit: status changed
    try {
      logAudit(req, {
        action: "incident.update_status",
        entity: "incident",
        entityId: String(id),
        meta: {
          from: before?.status ?? null,
          to: report?.status ?? req.body?.status ?? null,
        },
      });
    } catch {}

    return new HttpResponse(200, report).json(res);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async delete(req, res) {
    const { id } = req.params;
    if (!req.officer) {
      throw new HttpError({ code: 401 });
    }

    await reportsService.delete(id);

    // audit: incident deleted
    try {
      logAudit(req, {
        action: "incident.delete",
        entity: "incident",
        entityId: String(id),
      });
    } catch {}

    return new HttpResponse(204).sendStatus(res);
  }
}

const reportsController = new ReportsController();
module.exports = reportsController;
