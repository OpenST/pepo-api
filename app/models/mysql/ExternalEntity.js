const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for external entity model.
 *
 * @class ExternalEntityModel
 */
class ExternalEntityModel extends ModelBase {
  /**
   * Constructor for external entity model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'external_entities';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.entity_kind
   * @param {string} dbRow.entity_id
   * @param {string} dbRow.extra_data
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      entityKind: externalEntityConstants.entityKinds[dbRow.entity_kind],
      entityId: dbRow.entity_id,
      extraData: JSON.parse(dbRow.extra_data),
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch external entity by entity kind and entity id
   *
   * @param {string} entityKind
   * @param {number} entityId
   *
   * @return {object}
   */
  async fetchByEntityKindAndEntityId(entityKind, entityId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({
        entity_kind: externalEntityConstants.invertedEntityKinds[entityKind],
        entity_id: entityId
      })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch external entity by id
   *
   * @param {number} id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch external entities for given ids.
   *
   * @param {array} ids: external entities ids.
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   * @param {number} params.entityId
   * @param {string} params.entityKind
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const ExternalEntityByIds = require(rootPrefix + '/lib/cacheManagement/multi/ExternalEntityByIds');
    promisesArray.push(new ExternalEntityByIds({ ids: [params.id] }).clear());

    if (params.entityId && params.entityKind) {
      const ExternalEntityByEntityIdAndEntityKindCache = require(rootPrefix +
        '/lib/cacheManagement/single/ExternalEntitiyByEntityIdAndEntityKind');
      promisesArray.push(
        new ExternalEntityByEntityIdAndEntityKindCache({
          entityId: params.entityId,
          entityKind: params.entityKind
        }).clear()
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = ExternalEntityModel;
