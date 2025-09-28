const NoteModel = require("src/models/note.model");
const HttpError = require("src/utils/http-error");
const z = require("zod");

class NotesService {
  noteValidation = z.object({
    subject: z.string(),
    content: z.string(),
    resource_id: z.preprocess((val) => Number(val), z.number()).optional(),
    resource_type: z.literal(["report", "lost-article"]),
  });

  noteUpdateValidation = z.object({
    subject: z.string(),
    content: z.string(),
  });

  resourceGetPropertiesValidation = z.object({
    resourceId: z.preprocess((val) => Number(val), z.number()).optional(),
    resourceType: z.literal(["report", "lost-article"]),
    userId: z.number(),
    officer: z.boolean().optional(),
  });

  /**
   * @param {{ subject: string; content: string; resource_id: number; resource_type: ('report'|'lost-article')}} body
   * @returns {Promise<NoteModel>}
   */
  async resourceCreate(body) {
    const noteBody = this.noteValidation.parse(body);

    return await new NoteModel(
      noteBody.subject,
      noteBody.content,
      noteBody.resource_id,
      noteBody.resource_type,
    ).save();
  }

  /**
   * @param {number} resourceId
   * @param {('report'|'lost-article')} resourceType
   * @param {number} userId
   * @param {boolean} officer
   * @returns {Promise<NoteModel[]>}
   */
  async resourceGetAll(properties) {
    const validatedProperties =
      this.resourceGetPropertiesValidation.parse(properties);

    if (validatedProperties.officer) {
      return await NoteModel.findAllBy(
        "resource_id",
        validatedProperties.resourceId,
      );
    }

    const queries = {
      report: `
      SELECT n.* FROM notes n
      INNER JOIN reports r ON r.id = n.resource_id
      WHERE r.user_id = ? AND n.resource_id = ?
    `,
      "lost-article": `
      SELECT n.* FROM notes n
      INNER JOIN lost_items l ON l.id = n.resource_id
      WHERE l.user_id = ? AND n.resource_id = ?
    `,
    };

    return await NoteModel.allRaw(queries[validatedProperties.resourceType], [
      validatedProperties.userId,
      validatedProperties.resourceId,
    ]);
  }

  /**
   * @param {number} id
   * @param {number} userId
   * @param {boolean} officer
   * @returns {Promise<NoteModel>}
   */
  async getById(id, userId, officer) {
    if (!id || Number.isNaN(id)) {
      throw new HttpError({
        code: 400,
        clientMessage: "Note ID must be included",
      });
    }

    if (officer) {
      return await NoteModel.findById(id);
    }

    return await NoteModel.getRaw(
      `SELECT n.* FROM notes n
      LEFT JOIN reports r ON r.id = n.resource_id AND n.resource_type = 'report'
      LEFT JOIN lost_items l ON l.id = n.resource_id AND n.resource_type = 'lost-article'
      WHERE n.id = ? 
      AND (r.user_id = ? OR l.user_id = ?)`,
      [id, userId, userId],
    );
  }

  /**
   * @param {number} id
   * @param {{ subject: string; content: string; }} body
   * @returns {Promise<NoteModel>}
   */
  async updateById(id, body) {
    const noteUpdateBody = this.noteUpdateValidation.parse(body);

    /** @type {NoteModel} */
    const note = await NoteModel.findById(id);

    if (!note) {
      throw new HttpError({ code: 400 });
    }

    note.subject = noteUpdateBody.subject;
    note.content = noteUpdateBody.content;

    return await note.save();
  }

  /**
   * @param {number} id
   * @returns {boolean}
   */
  async deleteById(id) {
    if (!id || Number.isNaN(id)) {
      throw new HttpError({
        code: 400,
        clientMessage: "Alert ID must be included",
      });
    }

    const result = await NoteModel.deleteWhere("id", id);

    return result?.changes !== 0;
  }
}

const notesService = new NotesService();

module.exports = notesService;
