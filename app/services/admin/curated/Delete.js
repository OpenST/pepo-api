const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CuratedEntityModel = require(rootPrefix + '/app/models/mysql/CuratedEntity'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to delete specific curated entity row.
 *
 * @class DeleteForEntityIdAndKind
 */
class DeleteForEntityIdAndKind extends ServiceBase {
  /**
   * Constructor to delete specific curated entity row.
   *
   * @param {object} params
   * @param {object} params.current_admin
   * @param {number} params.current_admin.id
   * @param {string} params.entity_kind
   * @param {number} params.entity_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentAdminId = params.current_admin.id;
    oThis.entityKind = params.entity_kind;
    oThis.entityId = +params.entity_id;

    oThis.entityKindInt = 0;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    await oThis.fetchAndValidateExistingEntity();

    await oThis.deleteEntity();

    await oThis.logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize input parameters.
   *
   * @sets oThis.entityKindInt
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    oThis.entityKindInt = curatedEntitiesConstants.invertedEntityKinds[oThis.entityKind];

    if (!oThis.entityKindInt) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_d_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_kind'],
          debug_options: { entityKind: oThis.entityKind }
        })
      );
    }
  }

  /**
   * Fetch existing entry for the entity kind and validate if present.
   *
   * @sets oThis.entityDetails
   *
   * @returns {Promise<void>}
   */
  async fetchAndValidateExistingEntity() {
    const oThis = this;

    const curatedEntityIdsByKindCacheRsp = await new CuratedEntityIdsByKindCache({
      entityKind: oThis.entityKind
    }).fetch();

    if (!curatedEntityIdsByKindCacheRsp || curatedEntityIdsByKindCacheRsp.isFailure()) {
      return Promise.reject(curatedEntityIdsByKindCacheRsp);
    }

    const curatedEntityIds = curatedEntityIdsByKindCacheRsp.data.entityIds;

    if (curatedEntityIds.indexOf(oThis.entityId) === -1) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_d_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            entity_kind: oThis.entityKind,
            entity_id: oThis.entityId
          }
        })
      );
    }
  }

  /**
   * Delete curated entity from table.
   *
   * @returns {Promise<*>}
   */
  async deleteEntity() {
    const oThis = this;

    await new CuratedEntityModel().deleteForEntityIdAndKind(oThis.entityId, oThis.entityKind);
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async logAdminActivity() {
    const oThis = this;

    await new AdminActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.entityId,
      extraData: JSON.stringify({ eids: [oThis.entityId], enk: oThis.entityKind }),
      action: adminActivityLogConstants.deleteCuratedEntity
    });
  }
}

module.exports = DeleteForEntityIdAndKind;
