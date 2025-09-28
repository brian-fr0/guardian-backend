const { run, get, all } = require("../config/database");

function validWhereClauseArray(fields, values) {
  const fieldsIsArray = Array.isArray(fields);
  const valuesIsArray = Array.isArray(values);

  if (!fieldsIsArray || !valuesIsArray || fields.length !== values.length) {
    throw new Error("Invalid Where Clauses Array");
  }

  return true;
}

function pruneObject(object, expectedKeys) {
  return Object.fromEntries(
    Object.keys(object)
      .filter(
        (key) =>
          expectedKeys.includes(key) &&
          object[key] !== undefined &&
          object[key] !== null,
      )
      .map((key) => [key, object[key]]),
  );
}

/**
 * @template T
 */
class BaseModel {
  static table = "";
  static schema = "";
  static initialized = false;

  id = -1;

  static async initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    await run(this.schema);
  }

  /**
   * @returns {Promise<T>}
   */
  async save() {
    const isInsert =
      this.id === -1 || this.id === undefined || this.id === null;

    const keys = Object.keys(this);
    const validKeys = keys.filter((key) => {
      return this[key] !== -1 && this[key] !== undefined && this[key] !== null;
    });

    const values = validKeys.map((key) => this[key]);

    const insertQuery = `INSERT INTO ${this.constructor.table} (${validKeys.join(", ")}) VALUES (${validKeys.map(() => "?").join(", ")})`;
    const updateQuery = `UPDATE ${this.constructor.table} SET ${validKeys.map((key) => `${key} = ?`).join(", ")} WHERE id = ?`;

    if (isInsert) {
      const result = await run(insertQuery, values);
      const savedResult = await get(
        `SELECT * FROM ${this.constructor.table} WHERE rowid = ?`,
        [result.lastID],
      );
      const prunedResult = pruneObject(savedResult, keys);
      Object.assign(this, prunedResult);
      return this;
    }

    values.push(this.id);
    await run(updateQuery, values);
    return this;
  }

  /**
   * @returns {Promise<T>}
   */
  async delete() {
    if (this.id < 0 || this.id === null || this.id === undefined) {
      return;
    }
    await run(`DELETE FROM ${this.constructor.table} WHERE id = ?`, this.id);
    Object.assign(this, new this());
    return this;
  }

  /**
   * @param {string[]} fields
   * @param {unknown[]} values
   * @returns {Promise<*>} values
   */
  static async deleteWhere(fields, values) {
    let statment = `DELETE FROM ${this.table} WHERE `;

    if (Array.isArray(fields) || Array.isArray(values)) {
      validWhereClauseArray(fields, values);

      statment += `${fields.map((field) => `${field} = ?`).join(" AND ")} LIMIT 1`;
      return await run(statment, values);
    }

    statment += `${fields} = ?`;
    return await run(statment, values);
  }

  /**
   * @param {number} id
   * @returns {Promise<T | null>}
   */
  static async findById(id) {
    const query = `SELECT * FROM ${this.table} WHERE id = ?`;
    const result = await get(query, id);

    if (!result) {
      return null;
    }

    const instance = new this();
    const keys = Object.keys(instance);
    const prunedResult = pruneObject(result, keys);
    Object.assign(instance, prunedResult);
    return instance;
  }

  /**
   * @param {string[]} fields
   * @param {unknown[]} values
   * @returns {Promise<T | null>}
   */
  static async findBy(fields, values) {
    let query = `SELECT * FROM ${this.table} WHERE `;
    const instance = new this();
    const keys = Object.keys(instance);

    if (Array.isArray(fields) || Array.isArray(values)) {
      validWhereClauseArray(fields, values);

      query += `${fields.map((field) => `${field} = ?`).join(" AND ")} LIMIT 1`;
      const result = await get(query, values);

      if (!result) {
        return null;
      }

      Object.assign(instance, pruneObject(result, keys));
      return /** @type {T} */ (instance);
    }

    query += `${fields} = ? LIMIT 1`;
    const result = await get(query, values);

    if (!result) {
      return null;
    }

    Object.assign(instance, pruneObject(result, keys));
    return /** @type {T} */ (instance);
  }

  /**
   * @param {number} limit
   * @returns {Promise<T[] | null>}
   */
  static async all({ limit = 100, page = 0, orderBy }) {
    const query = `SELECT * FROM ${this.table} ${orderBy} LIMIT ${limit * page}, ?`;
    const instanceCore = new this();
    const keys = Object.keys(instanceCore);
    const results = await all(query, limit);

    if (!results || !Array.isArray(results)) {
      return null;
    }

    const instanceObjects = results.map((result) => {
      const instance = new this();
      const prunedResult = pruneObject(result, keys);
      return Object.assign(instance, prunedResult);
    });

    return instanceObjects;
  }

  /**
   * @param {string[]} fields
   * @param {unknown[]} values
   * @param {number} [limit=100]
   * @returns {Promise<T[] | null>}
   */
  static async findAllBy(fields, values, orderBy = "", limit = 100) {
    let query = `SELECT * FROM ${this.table} WHERE `;
    const keysInstance = new this();
    const keys = Object.keys(keysInstance);

    if (Array.isArray(fields) || Array.isArray(values)) {
      validWhereClauseArray(fields, values);

      query += `${fields.map((field) => `${field} = ?`).join(" AND ")} ${orderBy} LIMIT ?`;
      const result = await all(query, [values, limit]);

      if (!result) {
        return null;
      }

      const instanceObjects = results.map((result) => {
        const instance = new this();
        const prunedResult = pruneObject(result, keys);
        return Object.assign(instance, prunedResult);
      });

      return instanceObjects;
    }

    query += `${fields} = ? LIMIT ?`;
    const results = await all(query, [values, limit]);

    if (!results) {
      return null;
    }

    const instanceObjects = results.map((result) => {
      const instance = new this();
      const prunedResult = pruneObject(result, keys);
      return Object.assign(instance, prunedResult);
    });

    return instanceObjects;
  }

  static async allRaw(sql, values = null) {
    if (values) {
      return await all(sql, values);
    }

    return await all(sql);
  }

  static async getRaw(sql, values = null) {
    if (values) {
      return await get(sql, values);
    }

    return await get(sql);
  }

  static async runRaw(sql, values = null) {
    if (values) {
      return await run(sql, values);
    }

    return await run(sql);
  }

  /**
   * @returns {BaseModel}
   */
  static mapResultToModel(result) {
    const instance = new this();
    const keys = Object.keys(instance);

    if (!result) {
      return null;
    }

    Object.assign(instance, pruneObject(result, keys));
    return /** @type {T} */ (instance);
  }
}

module.exports = BaseModel;
