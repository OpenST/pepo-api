const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class ExternalEntityModel extends ModelBase {
  /**
   * External Entities model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'external_entities';
  }

  /**
   *
   * @param dbRow
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
    return {
      id: dbRow.id,
      entityKind: externalEntityConstants.entityKinds[dbRow.entity_kind],
      entityId: dbRow.entity_id,
      extraData: dbRow.extra_data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /***
   * Fetch external entity by entity kind and entity id
   *
   * @param entityKind {String} - entityKind
   * @param entityId {String} - entityId
   *
   * @return {Object}
   */
  async fetchByEntityKindAndEntityId(entityKind, entityId) {
    const oThis = this;
    let entityKindInt = externalEntityConstants.invertedEntityKinds[entityKind];
    let dbRows = await oThis
      .select('*')
      .where({ entity_kind: entityKindInt, entity_id: entityId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Fetch external entity by id
   *
   * @param id {Integer} - id
   *
   * @return {Object}
   */
  async fetchById(id) {
    const oThis = this;
    let dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /***
   * Fetch external entities for given ids
   *
   * @param Ids {Array} - External Entities Ids
   *
   * @return {Object}
   */
  async fetchByIds(Ids) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
      .select('*')
      .where(['id IN (?)', Ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /***
   * Flush cache
   *
   * @param {object} params
   * @param {Integer} params.Id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const ExternalEntityByIds = require(rootPrefix + '/lib/cacheManagement/multi/ExternalEntityByIds');

    await new ExternalEntityByIds({
      ids: [params.id]
    }).clear();

    const ExternalEntitiyByEntityIdAndEntityKindCache = require(rootPrefix +
      '/lib/cacheManagement/single/ExternalEntitiyByEntityIdAndEntityKind');

    if (params.entityId && params.entityKind) {
      await new ExternalEntitiyByEntityIdAndEntityKindCache({
        entityId: params.entityId,
        entityKind: params.entityKind
      }).clear();
    }
  }
}

module.exports = ExternalEntityModel;
