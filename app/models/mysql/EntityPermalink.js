const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  entityPermalinkConstant = require(rootPrefix + '/lib/globalConstant/entityPermalink');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for entity permalink model.
 *
 * @class EntityPermalink
 */
class EntityPermalink extends ModelBase {
  /**
   * Constructor for entity permalink model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'entity_permalinks';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.entity_id
   * @param {number} dbRow.entity_kind
   * @param {string} dbRow.permalink
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  _formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      entityId: dbRow.entity_id,
      entityKind: dbRow.entity_kind,
      permalink: dbRow.permalink,
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch entity permalink by entity id
   *
   * @param {number} entityId: entity id
   *
   * @return {object}
   */
  async fetchByEntityId(entityId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where([
        'entity_id = ? AND status = ?',
        entityId,
        entityPermalinkConstant.invertedStatuses[entityPermalinkConstant.currentEntityPermalinkStatus]
      ])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis._formatDbData(dbRows[0]);
  }

  /**
   * Insert into entity permalink
   *
   * @param {object} params: params
   * @param {number} params.entityId
   * @param {number} params.entityKind
   * @param {string} params.permalink
   * @param {number} params.status
   *
   * @return {object}
   */
  async insertEntityPermalink(params) {
    const oThis = this;

    const response = await oThis
      .insert({
        entity_kind: entityPermalinkConstant.invertedEntityKinds[params.entityKind],
        entity_id: params.entityId,
        permalink: params.permalink,
        status: entityPermalinkConstant.invertedStatuses[params.status]
      })
      .fire();

    return response.data;
  }
}

module.exports = EntityPermalink;
