const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TagMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  CuratedEntityModel = require(rootPrefix + '/app/models/mysql/CuratedEntity'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to order curated entities.
 *
 * @class Reorder
 */
class Reorder extends ServiceBase {
  /**
   * Constructor to order curated entities.
   *
   * @param {object} params
   * @param {object} params
   * @param {object} params.current_admin
   * @param {number} params.current_admin.id
   * @param {string} params.entity_kind
   * @param {array<number>} params.entity_ids
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
    oThis.entityIdsArray = params.entity_ids;

    oThis.oldCuratedOrder = [];
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

    await oThis.fetchExistingEntities();

    await oThis.deleteExistingEntities();

    await oThis.updateEntities();

    await oThis.logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize input parameters.
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    const uniqueEntityIdsArray = [...new Set(oThis.entityIdsArray)];

    if (uniqueEntityIdsArray.length !== oThis.entityIdsArray.length) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_r_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_ids'],
          debug_options: { entityIds: oThis.entityIdsArray }
        })
      );
    }

    if (oThis.entityIdsArray.length === 0 || oThis.entityIdsArray.length > 20) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_r_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_ids'],
          debug_options: { entityIds: oThis.entityIdsArray }
        })
      );
    }

    if (oThis.entityKind === curatedEntitiesConstants.userEntityKind) {
      await oThis.fetchAndValidateUsers();
    } else if (oThis.entityKind === curatedEntitiesConstants.tagsEntityKind) {
      await oThis.fetchAndValidateTags();
    } else {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_r_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_kind'],
          debug_options: { entityKind: oThis.entityKind }
        })
      );
    }
  }

  /**
   * Fetch and validate users.
   *
   * @returns {Promise<never>}
   */
  async fetchAndValidateUsers() {
    const oThis = this;

    const userDetailsCacheResponse = await new UserCache({ ids: oThis.entityIdsArray }).fetch();
    if (userDetailsCacheResponse.isFailure()) {
      return Promise.reject(userDetailsCacheResponse);
    }

    const userData = userDetailsCacheResponse.data;

    for (let index = 0; index < oThis.entityIdsArray.length; index++) {
      const userObject = userData[oThis.entityIdsArray[index]];
      if (!CommonValidators.validateNonEmptyObject(userObject) || userObject.status !== userConstants.activeStatus) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_c_r_4',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_entity_ids'],
            debug_options: { entityId: oThis.entityIdsArray }
          })
        );
      }
    }
  }

  /**
   * Fetch and validate tags.
   *
   * @returns {Promise<never>}
   */
  async fetchAndValidateTags() {
    const oThis = this;

    const tagsCacheResponse = await new TagMultiCache({ ids: oThis.entityIdsArray }).fetch();
    if (tagsCacheResponse.isFailure()) {
      return Promise.reject(tagsCacheResponse);
    }

    const tagData = tagsCacheResponse.data;

    for (let index = 0; index < oThis.entityIdsArray.length; index++) {
      const tagObject = tagData[oThis.entityIdsArray[index]];
      if (!CommonValidators.validateNonEmptyObject(tagObject)) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_c_r_5',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_entity_ids'],
            debug_options: { entityIds: oThis.entityIdsArray }
          })
        );
      }
    }
  }

  /**
   * Fetch existing entities.
   *
   * @sets oThis.oldCuratedOrder
   *
   * @returns {Promise<never>}
   */
  async fetchExistingEntities() {
    const oThis = this;

    const cacheResponse = await new CuratedEntityIdsByKindCache({
      entityKind: oThis.entityKind
    }).fetch();

    if (!cacheResponse || cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.oldCuratedOrder = cacheResponse.data[oThis.entityKind];
  }

  /**
   * Delete existing entries for the entity kind.
   *
   * @returns {Promise<void>}
   */
  async deleteExistingEntities() {
    const oThis = this;

    await new CuratedEntityModel().deleteAllOfKind(oThis.entityKind);

    await CuratedEntityModel.flushCache({ entityKind: oThis.entityKind });
  }

  /**
   * Update curated entities table.
   *
   * @returns {Promise<*>}
   */
  async updateEntities() {
    const oThis = this;

    const insertArray = [];

    const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[oThis.entityKind];

    for (let index = 0; index < oThis.entityIdsArray.length; index++) {
      insertArray.push([oThis.entityIdsArray[index], entityKindInt, index + 1]);
      // First position is entityId, second position is entityKind, third position is position of the entity.
    }

    await new CuratedEntityModel().insertEntities(insertArray);
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
      actionOn: 0,
      extraData: JSON.stringify({
        oldEids: oThis.oldCuratedOrder,
        newEids: oThis.entityIdsArray,
        enk: oThis.entityKind
      }),
      action: adminActivityLogConstants.reorderCuratedEntity
    });
  }
}

module.exports = Reorder;
