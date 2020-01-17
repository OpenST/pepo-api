const rootPrefix = '../../../',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ChannelByIds'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/ChannelUserByUserIdAndChannelIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelsConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class to remove user from a channel.
 *
 * @class LeaveChannel
 */
class LeaveChannel extends ServiceBase {
  /**
   * Constructor to remove user from a channel.
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

    await oThis._removeChannelUser();

    await oThis._updateChannelStat();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch and validate channel.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannel() {
    const oThis = this;

    const channelByIdsCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelByIdsCacheResponse.isFailure()) {
      return Promise.reject(channelByIdsCacheResponse);
    }

    const channelObj = channelByIdsCacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(channelObj) || channelObj.status !== channelsConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_l_fc_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId
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

    const channelUserCacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: oThis.currentUser.id,
      channelIds: [oThis.channelId]
    }).fetch();

    if (channelUserCacheResponse.isFailure()) {
      return Promise.reject(channelUserCacheResponse);
    }

    oThis.channelUserObj = channelUserCacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channelUserObj) ||
      oThis.channelUserObj.status !== channelUsersConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_l_fcu_1',
          api_error_identifier: 'user_inactive_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.currentUser.id
          }
        })
      );
    }
  }

  /**
   * Remove channel user.
   *
   * @sets oThis.channelUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _removeChannelUser() {
    const oThis = this;

    const updateParams = {
      status: channelUsersConstants.invertedStatuses[channelUsersConstants.inactiveStatus]
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
   * Update channel stat.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelStat() {
    const oThis = this;

    await new ChannelStatModel()
      .update('total_users = total_users - 1')
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelId: oThis.channelId });
  }
}

module.exports = LeaveChannel;
