const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class PublicVideoFeed extends ServiceBase {
  constructor() {
    const oThis = this;

    oThis.feeds = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.profileResponse = {};
    oThis.finalResponse = {};
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();
    await oThis._getFeeds();

    return oThis._prepareResponse();
  }

  async _validateAndSanitizeParams() {
    return responseHelper.successWithData({});
  }

  async _getFeeds() {
    const oThis = this;

    oThis.feeds = [
      {
        id: '1',
        kind: 'FAN_UPDATE',
        payload: {
          video_id: '123',
          user_id: '1000'
        }
      },
      {
        id: '2',
        kind: 'FAN_UPDATE',
        payload: {
          video_id: '124',
          user_id: '1001'
        }
      },
      {
        id: '3',
        kind: 'FAN_UPDATE',
        payload: {
          video_id: '125',
          user_id: '1002'
        }
      }
    ];

    oThis.userIds = [1000, 1001, 1002];
    oThis.videoIds = [123, 124, 125];
  }

  /**
   * Fetch profile details
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileDetails() {
    const oThis = this;

    let getProfileObj = new GetProfile({
      userIds: oThis.userIds,
      currentUserId: oThis.currentUserId,
      videoIds: oThis.videoIds
    });

    let profileResp = await getProfileObj.perform();

    if (profileResp.isFailure()) {
      return Promise.reject(profileResp);
    }
    oThis.profileResponse = profileResp.data;

    return responseHelper.successWithData({});
  }

  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      feedList: oThis.feeds,
      userProfileDetails: oThis.profileResponse.userProfileDetails,
      userProfileAllowedActions: oThis.profileResponse.userProfileAllowedActions,
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      imageMap: oThis.profileResponse.imageMap,
      videoMap: oThis.profileResponse.videoMap,
      linkMap: oThis.profileResponse.linkMap,
      tags: oThis.profileResponse.tags,
      userStat: oThis.profileResponse.userStat,
      videoDetailsMap: oThis.profileResponse.videoDetailsMap,
      currentUserUserContributionsMap: oThis.profileResponse.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.profileResponse.currentUserVideoContributionsMap,
      pricePointsMap: oThis.profileResponse.pricePointsMap
    });
  }
}

module.exports = PublicVideoFeed;
