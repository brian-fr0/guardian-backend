const z = require("zod");
const PersonalDetailsModel = require("../models/personal-details.model");
const { encrypt, decrypt } = require("../lib/crypto"); // 🔐 AES-256-GCM helper

// Store ciphertexts in existing columns with a clear prefix (no schema change)
const ENC_PREFIX = "enc:v1:";
const isEnc = (val) => typeof val === "string" && val.startsWith(ENC_PREFIX);
const encVal = (val) => (val == null ? null : ENC_PREFIX + encrypt(String(val)));
const decVal = (val) => (isEnc(val) ? decrypt(val.slice(ENC_PREFIX.length)) : val);

// Decrypts a row (model JSON or plain object) non-destructively
function decryptRow(row) {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    first_name: decVal(row.first_name),
    last_name: decVal(row.last_name),
    date_of_birth: decVal(row.date_of_birth),
    contact_number: decVal(row.contact_number),
  };
}

class PersonalDetailsService {
  PersonalDetailsValidation = z.object({
    first_name: z.string(),
    last_name: z.string(),
    // keep your existing validation semantics:
    date_of_birth: z.iso.date(),
    contact_number: z.string(),
  });

  /**
   * Create a personal-details row (not attached yet).
   * Writes encrypted values into existing columns, returns a *decrypted* view.
   */
  async create(body) {
    const { first_name, last_name, date_of_birth, contact_number } =
      this.PersonalDetailsValidation.parse(body);

    const model = new PersonalDetailsModel(
      encVal(first_name),
      encVal(last_name),
      encVal(date_of_birth),
      encVal(contact_number),
    );

    const saved = await model.save(); // one save
    return decryptRow(saved);         // return decrypted view to callers
  }

  /**
   * Attach a new witness to a report (single save).
   * Returns decrypted view.
   * @param {*} body
   * @param {number} report_id
   * @returns {Promise<PersonalDetailsModel>}
   */
  async createReportWitness(body, report_id) {
    const { first_name, last_name, date_of_birth, contact_number } =
      this.PersonalDetailsValidation.parse(body);

    const model = new PersonalDetailsModel(
      encVal(first_name),
      encVal(last_name),
      encVal(date_of_birth),
      encVal(contact_number),
    );
    model.attachToReport(report_id);

    const saved = await model.save(); // single save (no duplicate row)
    return decryptRow(saved);
  }

  /**
   *  @param {number} reportId
   *  @param {number} witnessId
   *  @returns {Promise<boolean>}
   */
  async deleteReportWitness(reportId, witnessId) {
    if (
      !reportId ||
      Number.isNaN(reportId) ||
      !witnessId ||
      Number.isNaN(witnessId)
    ) {
      throw new HttpError({
        code: 400,
        clientMessage: "ReportId and WitnessId must be included",
      });
    }

    const result = await PersonalDetailsModel.deleteWhere(
      ["id", "report_id"],
      [witnessId, reportId],
    );

    return result?.changes !== 0;
  }

  /**
   *  @param {number} lostArticleId
   *  @param {number} personalDetailsId
   *  @returns {Promise<boolean>}
   */
  async deleteLostArticlePersonalDetails(lostArticleId, personalDetailsId) {
    if (
      !lostArticleId ||
      Number.isNaN(lostArticleId) ||
      !personalDetailsId ||
      Number.isNaN(personalDetailsId)
    ) {
      throw new HttpError({
        code: 400,
        clientMessage: "LostArticleId and WitnessId must be included",
      });
    }

    const result = await PersonalDetailsModel.deleteWhere(
      ["id", "lost_article_id"],
      [personalDetailsId, lostArticleId],
    );

    return result?.changes !== 0;
  }

  /**
   * Create personal details for a Lost Article (single save).
   * Returns decrypted view.
   * @returns {Promise<PersonalDetailsModel>}
   */
  async createLostArticlePersonalDetails(body, lost_article_id) {
    const { first_name, last_name, date_of_birth, contact_number } =
      this.PersonalDetailsValidation.parse(body);

    const model = new PersonalDetailsModel(
      encVal(first_name),
      encVal(last_name),
      encVal(date_of_birth),
      encVal(contact_number),
    );
    model.attachToLostArticle(lost_article_id);

    const saved = await model.save(); // single save
    return decryptRow(saved);
  }

  /**
   * @param {number} report_id
   * @returns {Promise<Array|PersonalDetailsModel | null>}
   */
  async findByReportId(report_id) {
    const rows = await PersonalDetailsModel.findAllBy("report_id", report_id);
    if (Array.isArray(rows)) return rows.map(decryptRow);
    return decryptRow(rows);
  }

  /**
   * @param {number} lost_article_id
   */
  async findByLostArticleId(lost_article_id) {
    const result = await PersonalDetailsModel.findAllBy(
      "lost_article_id",
      lost_article_id,
    );

    const data = Array.isArray(result) ? result.map(decryptRow) : decryptRow(result);

    return {
      error: false,
      code: 200,
      data,
    };
  }
}

const personalDetailsService = new PersonalDetailsService();

module.exports = personalDetailsService;
