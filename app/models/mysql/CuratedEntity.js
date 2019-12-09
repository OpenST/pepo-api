const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
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
   * Insert into curated entities.
   *
   * @param {number} entityId
   * @param {string} entityKind
   * @param {string} newPosition
   *
   * @returns {Promise<{}>}
   */
  async insertIntoCuratedEntity(entityId, entityKind, newPosition) {
    const oThis = this;

    const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[entityKind];

    if (!entityKindInt) {
      return Promise.reject(new Error('Invalid entity kind.'));
    }

    await oThis
      .insert({
        entity_id: entityId,
        entity_kind: entityKindInt,
        position: newPosition
      })
      .fire()
      .then(async function(insertRsp) {
        await CuratedEntity.flushCache({ entityKind: entityKind });
      })
      .catch(async function(err) {
        if (CuratedEntity.isDuplicateIndexViolation(CuratedEntity.curatedEntityIdAndEntityKindUniqueIndexName, err)) {
          logger.error(`Duplicate entry for entityId: ${entityId} and entityKind: ${entityKind}`);
          logger.log('Insert curated entity: DuplicateIndexViolation::err ->', err);
        } else {
          // Insert failed due to some other reason.
          // Send error email from here.
          const errorObject = responseHelper.error({
            internal_error_identifier: 'a_m_m_ce_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: { Reason: 'Curated entity not updated for:', entityId: entityId, error: err }
          });
          createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);

          return Promise.reject(errorObject);
        }
      });
  }

  /**
   * Update position for curated entity.
   *
   * @param {number} entityId
   * @param {string} entityKind
   * @param {string} newPosition
   *
   * @returns {Promise<{}>}
   */
  async updatePositionForCuratedEntity(entityId, entityKind, newPosition) {
    const oThis = this;

    const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[entityKind];

    if (!entityKindInt) {
      return Promise.reject(new Error('Invalid entity kind.'));
    }

    await oThis
      .update({
        position: newPosition
      })
      .where({
        entity_id: entityId,
        entity_kind: entityKindInt
      })
      .fire()
      .then(async function(updateRsp) {
        await CuratedEntity.flushCache({ entityKind: entityKind });
      })
      .catch(async function(err) {
        if (CuratedEntity.isDuplicateIndexViolation(CuratedEntity.curatedEntityKindAndPositionUniqueIndexName, err)) {
          // Do nothing.
          logger.error(`Duplicate entry for entityId: ${entityId} and entityKind: ${entityKind}`);
          logger.log('Update curated entity: DuplicateIndexViolation::err ->', err);
        } else {
          // Insert failed due to some other reason.
          // Send error email from here.
          const errorObject = responseHelper.error({
            internal_error_identifier: 'a_m_m_ce_2',
            api_error_identifier: 'something_went_wrong',
            debug_options: { Reason: 'Curated entity not updated for:', entityId: entityId, error: err }
          });
          createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);

          return Promise.reject(errorObject);
        }
      });
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

    await CuratedEntity.flushCache({ entityKind: entityKind });
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get curatedEntityIdAndEntityKindUniqueIndexName() {
    return 'c_u_idx_1';
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get curatedEntityKindAndPositionUniqueIndexName() {
    return 'c_u_idx_2';
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
