const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to get channel details.
 *
 * @class GetChannel
 */
class GetChannel extends ServiceBase {
  /**
   * Constructor to get channel details.
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

    oThis.channelId = params.channel_id;
    oThis.currentUser = params.current_user || {};

    oThis.channelDetails = {};
    oThis.channelStats = {};
    oThis.currentUserChannelRelations = {};
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateChannel();

    const promisesArray = [oThis._fetchChannelStats(), oThis._fetchUserChannelRelations()];

    await Promise.all(promisesArray);
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channelDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateChannel() {
    const oThis = this;

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelDetails = cacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(channelDetails) ||
      channelDetails.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_g_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: channelDetails
          }
        })
      );
    }

    oThis.channelDetails = channelDetails;
  }

  /**
   * Fetch channel stats.
   *
   * @sets oThis.channelStats
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

    const channelStats = cacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(channelStats)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_g_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelStats: channelStats
          }
        })
      );
    }

    oThis.channelStats = channelStats;
  }

  /**
   * Fetch current user channel relations.
   *
   * @sets oThis.currentUserChannelRelations
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserChannelRelations() {
    const oThis = this;

    if (!oThis.currentUser.id) {
      return;
    }

    oThis.currentUserChannelRelations = { [oThis.channelId]: { is_member: 0, has_muted: 0, has_blocked: 0 } };

    const userId = oThis.currentUser.id;
    const cacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: userId,
      channelIds: [oThis.channelId]
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelUserRelation = cacheResponse.data[oThis.channelId];
    if (
      CommonValidators.validateNonEmptyObject(channelUserRelation) &&
      channelUserRelation.status === channelUsersConstants.activeStatus
    ) {
      oThis.currentUserChannelRelations[oThis.channelId].is_member = 1;
    }
  }
}

module.exports = GetChannel;
