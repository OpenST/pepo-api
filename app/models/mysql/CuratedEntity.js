const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for curated entity model.
 *
 * @class CuratedEntity
 */
class CuratedEntity extends ModelBase {
  /**
   * Constructor for curated entity model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'curated_entities';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.entity_id
   * @param {number} dbRow.entity_kind
   * @param {number} dbRow.position
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      entityId: Number(dbRow.entity_id),
      entityKind: curatedEntitiesConstants.entityKinds[dbRow.entity_kind],
      position: Number(dbRow.position),
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Insert entities.
   *
   * @param {array} insertArray
   *
   * @returns {Promise<*>}
   */
  async insertEntities(insertArray) {
    const oThis = this;

    return oThis.insertMultiple(['entity_id', 'entity_kind', 'position'], insertArray, { touch: true }).fire();
  }

  /**
   * Get entity ids for particular entity kind.
   *
   * @param {string} entityKind
   *
   * @returns {Promise<{}>}
   */
  async getForKind(entityKind) {
    const oThis = this;

    const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[entityKind];

    if (!entityKindInt) {
      return Promise.reject(new Error('Invalid entity kind.'));
    }

    const dbRows = await oThis
      .select('*')
      .where({ entity_kind: entityKindInt })
      .order_by('position ASC')
      .fire();

    const entityIds = [],
      entityDetails = {};

    for (let index = 0; index < dbRows.length; index++) {
      const curatedEntity = oThis.formatDbData(dbRows[index]);
      entityIds.push(curatedEntity.entityId);
      entityDetails[curatedEntity.entityId] = curatedEntity;
    }

    return { entityIds: entityIds, entityDetails: entityDetails };
  }

  /**
   * Delete row for particular entity id and kind.
   *
   * @param {number} entityId
   * @param {string} entityKind
   *
   * @returns {Promise<never>}
   */
  async deleteForEntityIdAndKind(entityId, entityKind) {
    const oThis = this;

    const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[entityKind];

    if (!entityKindInt) {
      return Promise.reject(new Error('Invalid entity kind.'));
    }

    await oThis
      .delete()
      .where({
        entity_id: entityId,
        entity_kind: entityKindInt
      })
      .fire();
    // TODO - curated - flush cache from here.
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string} params.entityKind
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    const CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind');

    await new CuratedEntityIdsByKindCache({ entityKind: params.entityKind }).clear();
  }
}

module.exports = CuratedEntity;
