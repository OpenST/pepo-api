const rootPrefix = '../../..',
  DisconnectBase = require(rootPrefix + '/app/services/disconnect/Base'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended');

class TwitterDisconnect extends DisconnectBase {
  /**
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.twitterUserId = null;
  }

  /**
   * Get twitter user id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getSocialId() {
    const oThis = this;

    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.currentUserId]
    }).fetch();

    if (twitterUserCacheRsp.isFailure()) {
      return Promise.reject(twitterUserCacheRsp);
    }

    oThis.twitterUserId = twitterUserCacheRsp.data[oThis.currentUserId].id;
  }

  /**
   * Mark token and secret null in twitter users extended.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markTokenNull() {
    const oThis = this;

    await new TwitterUserExtendedModel()
      .update({
        token: null,
        secret: null,
        access_type: twitterUserExtendedConstants.invertedAccessTypes[twitterUserExtendedConstants.noneAccessType],
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.expiredStatus]
      })
      .where({ twitter_user_id: oThis.twitterUserId })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      twitterUserId: oThis.twitterUserId
    });
  }
}

module.exports = TwitterDisconnect;
