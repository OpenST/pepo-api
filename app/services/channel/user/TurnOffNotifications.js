const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/getCurrentUserChannelRelations'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to turn off notifications of channel.
 *
 * @class TurnOffChannelNotifications
 */
class TurnOffChannelNotifications extends ServiceBase {
  /**
   * Constructor to turn off notifications of channel.
   *
   * @param {object} params
   * @param {number} params.channel_id
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.channelId = params.channel_id;

    oThis.channelUserObj = null;
    oThis.currentUserChannelRelationsMap = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchChannel();

    await oThis._fetchChannelUser();

    await oThis._updateChannelUser();

    await oThis._fetchCurrentUserChannelRelations();

    return responseHelper.successWithData({
      [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelationsMap
    });
  }

  /**
   * Fetch and validate channel.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannel() {
    const oThis = this;

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelObj = cacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(channelObj) || channelObj.status !== channelConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_u_tfn_fc_1',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: channelObj
          }
        })
      );
    }
  }

  /**
   * Fetch and validate channel user.
   *
   * @sets oThis.channelUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelUser() {
    const oThis = this;

    const cacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: oThis.currentUser.id,
      channelIds: [oThis.channelId]
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelUserObj = cacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(oThis.channelUserObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_tfn_fcu_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.currentUser.id
          }
        })
      );
    }

    if (oThis.channelUserObj.status === channelUsersConstants.inactiveStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_tfn_fcu_2',
          api_error_identifier: 'user_inactive_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.currentUser.id
          }
        })
      );
    }

    if (oThis.channelUserObj.status === channelUsersConstants.blockedStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_tfn_fcu_3',
          api_error_identifier: 'user_blocked_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.currentUser.id
          }
        })
      );
    }

    if (oThis.channelUserObj.notificationStatus === channelUsersConstants.inactiveNotificationStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_tfn_fcu_4',
          api_error_identifier: 'notification_already_turned_off_for_user_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.currentUser.id
          }
        })
      );
    }
  }

  /**
   * Update channel user as active.
   *
   * @sets oThis.channelUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelUser() {
    const oThis = this;

    const updateParams = {
      notification_status:
        channelUsersConstants.invertedNotificationStatuses[channelUsersConstants.inactiveNotificationStatus]
    };

    const updateResponse = await new ChannelUserModel()
      .update(updateParams)
      .where({ id: oThis.channelUserObj.id })
      .fire();

    Object.assign(updateParams, updateResponse.defaultUpdatedAttributes);

    const formattedUpdatedParams = new ChannelUserModel().formatDbData(updateParams);
    Object.assign(oThis.channelUserObj, formattedUpdatedParams);

    await ChannelUserModel.flushCache(oThis.channelUserObj);
  }

  /**
   * Fetch current user channel relations
   *
   * @sets oThis.currentUserChannelRelationsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCurrentUserChannelRelations() {
    const oThis = this;

    const currentUserChannelRelationLibParams = {
      currentUserId: oThis.currentUser.id,
      channelIds: [oThis.channelId]
    };

    const currentUserChannelRelationsResponse = await new GetCurrentUserChannelRelationsLib(
      currentUserChannelRelationLibParams
    ).perform();
    if (currentUserChannelRelationsResponse.isFailure()) {
      return Promise.reject(currentUserChannelRelationsResponse);
    }

    oThis.currentUserChannelRelationsMap = currentUserChannelRelationsResponse.data.currentUserChannelRelations;
  }
}

module.exports = TurnOffChannelNotifications;
