const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to get current user channel relations.
 *
 * @class GetCurrentUserChannelRelations
 */
class GetCurrentUserChannelRelations {
  /**
   * Constructor of class to get current user channel relations.
   *
   * @param {number} params.currentUserId
   * @param {array<number>} params.channelIds
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.currentUserId = params.currentUserId;
    oThis.channelIds = params.channelIds;

    oThis.currentUserChannelRelations = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchUserChannelRelations();

    return responseHelper.successWithData({
      currentUserChannelRelations: oThis.currentUserChannelRelations
    });
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

    const cacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: oThis.currentUserId,
      channelIds: oThis.channelIds
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelUserRelations = cacheResponse.data;

    for (let index = 0; index < oThis.channelIds.length; index++) {
      const channelId = oThis.channelIds[index];
      oThis.currentUserChannelRelations[channelId] = {
        id: oThis.currentUserId,
        isAdmin: 0,
        isMember: 0,
        notificationStatus: 0,
        updatedAt: Math.round(new Date() / 1000)
      };

      const channelUserRelation = channelUserRelations[channelId];
      if (
        CommonValidators.validateNonEmptyObject(channelUserRelation) &&
        channelUserRelation.status === channelUsersConstants.activeStatus
      ) {
        oThis.currentUserChannelRelations[channelId] = {
          id: oThis.currentUserId,
          isAdmin: Number(channelUserRelation.role === channelUsersConstants.adminRole),
          isMember: 1,
          notificationStatus: Number(
            channelUserRelation.notificationStatus === channelUsersConstants.activeNotificationStatus
          ),
          updatedAt: channelUserRelation.updatedAt
        };
      }
    }
  }
}

module.exports = GetCurrentUserChannelRelations;
