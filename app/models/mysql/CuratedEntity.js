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
   * Flush cache.
   *
   * @param {object} params
   * @param {object} params.entityKind
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    const CacheKlass = require(rootPrefix + '/klass.js');

    await new CacheKlass({ entityKind: params.entityKind }).clear();
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
      entityId: dbRow.entity_id,
      entityKind: curatedEntitiesConstants.entityKinds[dbRow.entity_kind],
      position: dbRow.position,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Delete all rows of a particular entity kind.
   *
   * @param {string} entityKind
   *
   * @returns {Promise<never>}
   */
  async deleteAllOfKind(entityKind) {
    const oThis = this;

    const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[entityKind];

    if (!entityKindInt) {
      return Promise.reject(new Error('Invalid entity kind.'));
    }

    await oThis.delete({ entity_kind: entityKindInt }).fire();

    await CuratedEntity.flushCache({ entityKind: entityKind });
  }
}

module.exports = CuratedEntity;
