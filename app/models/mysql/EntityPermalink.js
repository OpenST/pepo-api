const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  entityPermalinkConstant = require(rootPrefix + '/lib/globalConstant/entityPermalink');
const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for entity permalink model.
 *
 * @class
 */
class EntityPermalink extends ModelBase {
  /**
   * entity permalink model
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
   * @param {string} dbRow.entity_id
   * @param {string} dbRow.entity_kind
   * @param {string} dbRow.permalink
   * @param {string} dbRow.status
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  _formatDbData(dbRow) {
    return {
      id: dbRow.id,
      entity_id: dbRow.entity_id,
      entity_kind: dbRow.entity_kind,
      permalink: dbRow.permalink,
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /***
   * Fetch entity permalink by entity id
   *
   * @param entityId {Integer} - entity id
   *
   * @return {Object}
   */
  async fetchByEntityId(entityId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where(['entity_id = ?', entityId])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Insert into entity permalink
   *
   * @param params {object} - params
   *
   * @return {object}
   */
  async insertEntityPermalink(params) {
    const oThis = this;
    let response = await oThis
      .insert({
        entity_kind: params.entity_kind,
        entity_id: entityPermalinkConstant.invertedEntityKinds[params.entity_id],
        permalink: params.permalink,
        status: params.status
      })
      .fire();

    return response.data;
  }
}

module.exports = EntityPermalink;
