const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class PublicVideoFeed extends FeedBase {
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.feeds = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.profileResponse = {};
    oThis.finalResponse = {};
  }

  async _validateAndSanitizeParams() {
    return responseHelper.successWithData({});
  }

  _setFeedIds() {
    const oThis = this;
    oThis.feedIds = [1, 2, 3, 4, 5];
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
