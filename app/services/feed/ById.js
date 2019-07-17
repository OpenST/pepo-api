const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class PublicVideoFeed extends FeedBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.feedId = params.feed_id;
  }

  async _validateAndSanitizeParams() {
    const oThis = this;

    return responseHelper.successWithData({});
  }

  _setFeedIds() {
    oThis.feedIds = [oThis.feedId];
  }

  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      feed: oThis.feeds[oThis.feedId],
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
