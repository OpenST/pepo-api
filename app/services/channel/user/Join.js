const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/getCurrentUserChannelRelations'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to add user to a channel.
 *
 * @class JoinChannel
 */
class JoinChannel extends ServiceBase {
  /**
   * Constructor to add user to a channel.
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
    oThis.channelStatsMap = {};
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

    await oThis._addUpdateChannelUser();

    await oThis._updateChannelStats();

    await oThis._fetchCurrentUserChannelRelations();

    await oThis._fetchChannelStats();

    return responseHelper.successWithData({
      [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelationsMap,
      [entityTypeConstants.channelStatsMap]: oThis.channelStatsMap
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
          internal_error_identifier: 'a_s_c_u_j_fc_1',
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

    if (
      CommonValidators.validateNonEmptyObject(oThis.channelUserObj) &&
      oThis.channelUserObj.status === channelUsersConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_j_fcu_1',
          api_error_identifier: 'user_active_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.currentUser.id
          }
        })
      );
    }

    if (
      CommonValidators.validateNonEmptyObject(oThis.channelUserObj) &&
      oThis.channelUserObj.status === channelUsersConstants.blockedStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_j_fcu_2',
          api_error_identifier: 'user_blocked_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.currentUser.id
          }
        })
      );
    }
  }

  /**
   * Add or update channel user as active.
   *
   * @sets oThis.channelUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUpdateChannelUser() {
    const oThis = this;

    if (CommonValidators.validateNonEmptyObject(oThis.channelUserObj)) {
      const updateParams = {
        role: channelUsersConstants.invertedRoles[channelUsersConstants.normalRole],
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus],
        notification_status:
          channelUsersConstants.invertedNotificationStatuses[channelUsersConstants.activeNotificationStatus]
      };

      const updateResponse = await new ChannelUserModel()
        .update(updateParams)
        .where({ id: oThis.channelUserObj.id })
        .fire();

      Object.assign(updateParams, updateResponse.defaultUpdatedAttributes);

      const formattedUpdatedParams = new ChannelUserModel().formatDbData(updateParams);
      Object.assign(oThis.channelUserObj, formattedUpdatedParams);
    } else {
      const insertData = {
        channel_id: oThis.channelId,
        user_id: oThis.currentUser.id,
        role: channelUsersConstants.invertedRoles[channelUsersConstants.normalRole],
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus],
        notification_status:
          channelUsersConstants.invertedNotificationStatuses[channelUsersConstants.activeNotificationStatus]
      };

      const insertResponse = await new ChannelUserModel().insert(insertData).fire();

      if (!insertResponse) {
        logger.error('Error while inserting data in channel_user table.');

        return Promise.reject(new Error('Error while inserting data in channel_user table.'));
      }

      insertData.id = insertResponse.insertId;
      Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

      oThis.channelUserObj = new ChannelUserModel().formatDbData(insertData);
    }

    await ChannelUserModel.flushCache(oThis.channelUserObj);
  }

  /**
   * Update channel stats.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelStats() {
    const oThis = this;

    await new ChannelStatModel()
      .update('total_users = total_users + 1')
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelIds: [oThis.channelId] });
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

  /**
   * Fetch channel stats.
   *
   * @sets oThis.channelStatsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelStats() {
    const oThis = this;

    const cacheResponse = await new ChannelStatByChannelIdsCache({ channelIds: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelStatsMap = cacheResponse.data;

    if (!CommonValidators.validateNonEmptyObject(oThis.channelStatsMap[oThis.channelId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_j_fcu_3',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelStats: oThis.channelStatsMap[oThis.channelId]
          }
        })
      );
    }
  }
}

module.exports = JoinChannel;
