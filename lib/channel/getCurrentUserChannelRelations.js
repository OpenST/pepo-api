const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * @class GetCurrentUserChannelRelations
 *
 * Class to get current user channel relations.
 */
class GetCurrentUserChannelRelations {
  /**
   * Constructor of class to get current user channel relations.
   *
   * @param {string} params.currentUser
   * @param {number} params.channelIds
   */
  constructor(params) {
    const oThis = this;
    oThis.currentUser = params.currentUser;
    oThis.channelIds = params.channelIds;

    oThis.currentUserChannelRelations = {};
  }

  /**
   * Perform operation.
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

    const userId = oThis.currentUser.id;
    const ChannelUserByUserIdAndChannelIdsCacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: userId,
      channelIds: oThis.channelIds
    }).fetch();

    if (ChannelUserByUserIdAndChannelIdsCacheResponse.isFailure()) {
      return Promise.reject(ChannelUserByUserIdAndChannelIdsCacheResponse);
    }

    const channelUserRelations = ChannelUserByUserIdAndChannelIdsCacheResponse.data;

    for (const channelId in channelUserRelations) {
      oThis.currentUserChannelRelations[channelId] = {
        id: oThis.currentUser.id,
        isAdmin: 0,
        isMember: 0,
        notificationStatus: 0,
        updatedAt: 0
      };

      const channelUserRelation = channelUserRelations[channelId];
      if (
        CommonValidators.validateNonEmptyObject(channelUserRelation) &&
        channelUserRelation.status === channelUsersConstants.activeStatus
      ) {
        oThis.currentUserChannelRelations[channelId] = {
          id: oThis.currentUser.id,
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
