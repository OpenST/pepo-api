const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TagMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  CuratedEntityModel = require(rootPrefix + '/app/models/mysql/CuratedEntity'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelsConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to insert or update entry in curated entities.
 *
 * @class UpdateCuratedEntities
 */
class UpdateCuratedEntities extends ServiceBase {
  /**
   * Constructor to insert/update entries in curated entities.
   *
   * @param {object} params
   * @param {object} params.current_admin
   * @param {string} params.entity_kind
   * @param {number} params.entity_id
   * @param {string} params.position
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
    oThis.newPosition = params.position;
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

    switch (oThis.entityKind) {
      case curatedEntitiesConstants.userEntityKind: {
        await oThis.fetchAndValidateUser();
        break;
      }
      case curatedEntitiesConstants.tagsEntityKind: {
        await oThis.fetchAndValidateTag();
        break;
      }
      case curatedEntitiesConstants.channelsEntityKind: {
        await oThis.fetchAndValidateChannel();
        break;
      }
      default: {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_c_i_1',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_entity_kind'],
            debug_options: { entityKind: oThis.entityKind }
          })
        );
      }
    }
  }

  /**
   * Fetch existing entities.
   *
   * @returns {Promise<never>}
   */
  async fetchExistingEntities() {
    const oThis = this;

    const cacheResponse = await new CuratedEntityIdsByKindCache({ entityKind: oThis.entityKind }).fetch();
    if (!cacheResponse || cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const entityIdsArray = cacheResponse.data.entityIds;

    if (entityIdsArray.indexOf(oThis.entityId) === -1) {
      // If entityId does not exists in the curated entities table, insert new entry.
      await new CuratedEntityModel().insertIntoCuratedEntity(oThis.entityId, oThis.entityKind, oThis.newPosition);
    } else {
      // If entityId already exists in the curated entities table, update its position.
      await new CuratedEntityModel().updatePositionForCuratedEntity(
        oThis.entityId,
        oThis.entityKind,
        oThis.newPosition
      );
    }
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
      action: adminActivityLogConstants.updateCuratedEntity
    });
  }

  /**
   * Fetch and validate user.
   *
   * @returns {Promise<never>}
   */
  async fetchAndValidateUser() {
    const oThis = this;

    const userDetailsCacheResponse = await new UserCache({ ids: [oThis.entityId] }).fetch();
    if (userDetailsCacheResponse.isFailure()) {
      return Promise.reject(userDetailsCacheResponse);
    }

    const userObj = userDetailsCacheResponse.data[oThis.entityId];

    if (!CommonValidators.validateNonEmptyObject(userObj)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_i_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_id'],
          debug_options: { entityId: oThis.entityId }
        })
      );
    }

    if (userObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_i_4',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch and validate tag.
   *
   * @returns {Promise<never>}
   */
  async fetchAndValidateTag() {
    const oThis = this;

    const tagsCacheResponse = await new TagMultiCache({ ids: [oThis.entityId] }).fetch();
    if (tagsCacheResponse.isFailure()) {
      return Promise.reject(tagsCacheResponse);
    }

    const tagData = tagsCacheResponse.data[oThis.entityId];

    if (!CommonValidators.validateNonEmptyObject(tagData) || tagData.status !== tagConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_i_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_id'],
          debug_options: { entityId: oThis.entityId }
        })
      );
    }
  }

  /**
   * Fetch and validate channel.
   *
   * @returns {Promise<never>}
   */
  async fetchAndValidateChannel() {
    const oThis = this;

    const channelByIdsCacheResponse = await new ChannelByIdsCache({ ids: [oThis.entityId] }).fetch();
    if (channelByIdsCacheResponse.isFailure()) {
      return Promise.reject(channelByIdsCacheResponse);
    }

    const channelObj = channelByIdsCacheResponse.data[oThis.entityId];

    if (!CommonValidators.validateNonEmptyObject(channelObj) || channelObj.status !== channelsConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_j_fc_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId
          }
        })
      );
    }
  }
}

module.exports = UpdateCuratedEntities;
