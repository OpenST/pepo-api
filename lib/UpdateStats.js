const rootPrefix = '..',
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  UserContributorModel = require(rootPrefix + '/app/models/mysql/UserContributor'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  twitterUserConnectionConstants = require(rootPrefix + '/lib/globalConstant/twitterUserConnection');

class UpdateStats {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.fromUserId - From user id
   * @param {number} params.toUserId - To user id
   * @param {number} [params.videoId] - Video id
   * @param {number} params.totalAmount - Total amount
   */
  constructor(params) {
    const oThis = this;

    oThis.fromUserId = params.fromUserId;
    oThis.toUserId = params.toUserId;
    oThis.videoId = params.videoId;
    oThis.totalAmount = params.totalAmount;

    oThis.existingVideoContributor = true;
    oThis.existingUserContributor = true;
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this,
      promiseArray = [];

    const currentTime = Date.now();

    if (oThis.videoId) {
      await oThis._updateVideoContributors();

      promiseArray.push(oThis._updateVideoDetails());
    }

    promiseArray.push(oThis._updateUserContributors());

    await Promise.all(promiseArray);

    if (oThis.existingUserContributor) {
      promiseArray.push(oThis._updateUserStats());
    } else {
      promiseArray.push(oThis._createUserStats());

      promiseArray.push(oThis._updateTwitterUserConnection());
    }

    await Promise.all(promiseArray);

    logger.log('Total time : ', Date.now() - currentTime);
  }

  /**
   * Update video contributors.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoContributors() {
    const oThis = this;

    const updateResponse = await new VideoContributorModel().updateByVideoIdAndContributedByUserId(
      oThis.videoId,
      oThis.fromUserId,
      oThis.totalAmount
    );

    if (updateResponse.changedRows === 0) {
      // Create video contributors.
      const insertResponse = await new VideoContributorModel().insertVideoContributor(
        oThis.videoId,
        oThis.fromUserId,
        oThis.totalAmount
      );

      oThis.existingVideoContributor = false;
    }

    // Flush cache.
    await VideoContributorModel.flushCache({ id: oThis.fromUserId, videoIds: [oThis.videoId] });
  }

  /**
   * Update video details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoDetails() {
    const oThis = this;

    let updateResponse = null;

    if (oThis.existingVideoContributor) {
      updateResponse = await new VideoDetailsModel().updateByVideoId(oThis.videoId, oThis.totalAmount, 0);
    } else {
      updateResponse = await new VideoDetailsModel().updateByVideoId(oThis.videoId, oThis.totalAmount, 1);
    }

    if (updateResponse.changedRows === 0) {
      logger.error('Video details should have entry.');
    }
    // Flush cache.
    await VideoDetailsModel.flushCache({ userId: oThis.toUserId, videoId: oThis.videoId });
  }

  /**
   * Update user contributor.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserContributors() {
    const oThis = this;

    const updateResponse = await new UserContributorModel().updateByUserIdAndContributedByUserId(
      oThis.toUserId,
      oThis.fromUserId,
      oThis.totalAmount
    );

    // Create user contributors, if row doesn't exist.
    if (updateResponse.changedRows === 0) {
      oThis.existingUserContributor = false;

      const insertResponse = await new UserContributorModel().insertUserContributor(
        oThis.toUserId,
        oThis.fromUserId,
        oThis.totalAmount
      );
    }

    // Flush cache.
    await UserContributorModel.flushCache({ contributedByUserId: oThis.fromUserId, userId: oThis.toUserId });
  }

  /**
   * Update user stats.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserStats() {
    const oThis = this;

    // Update user stat for toUserId.
    const updateToUserIdRsp = await new UserStatModel().updateUserStat(oThis.toUserId, 0, 0, oThis.totalAmount);

    // Flush cache.
    await UserStatModel.flushCache({ userIds: [oThis.fromUserId, oThis.toUserId] });
  }

  /**
   * Update user stats.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createUserStats() {
    const oThis = this;

    // Create user stat for fromUserId.
    await new UserStatModel().createUserStat(oThis.fromUserId, 0, 1, 0).catch(async function(error) {
      logger.error('In catch block . Error: ', error);

      // Update user stat for fromUserId.
      await new UserStatModel().updateUserStat(oThis.fromUserId, 0, 1, 0);
    });

    // Create user stat for toUserId.
    await new UserStatModel().createUserStat(oThis.toUserId, 1, 0, oThis.totalAmount).catch(async function(error) {
      logger.error('In catch block . Error: ', error);

      // Update user stat for toUserId.
      await new UserStatModel().updateUserStat(oThis.toUserId, 1, 0, oThis.totalAmount);
    });

    // Flush cache.
    await UserStatModel.flushCache({ userIds: [oThis.fromUserId, oThis.toUserId] });
  }

  /**
   * Update twitter user connection.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTwitterUserConnection() {
    const oThis = this;

    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.fromUserId, oThis.toUserId]
    }).fetch();

    if (twitterUserCacheRsp.isFailure()) {
      return Promise.reject(twitterUserCacheRsp);
    }

    if (!twitterUserCacheRsp.data[oThis.fromUserId].id || !twitterUserCacheRsp.data[oThis.toUserId].id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_us_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { errorMsg: twitterUserCacheRsp }
        })
      );
    }
    const fromTwitterUserId = twitterUserCacheRsp.data[oThis.fromUserId].id,
      toTwitterUserId = twitterUserCacheRsp.data[oThis.toUserId].id,
      propertyVal =
        twitterUserConnectionConstants.invertedProperties[
          twitterUserConnectionConstants.isTwitterUser2ContributedToProperty
        ];

    const updateResponse = await new TwitterUserConnectionModel().updateTwitterUserConnection(
      fromTwitterUserId,
      toTwitterUserId,
      propertyVal
    );
  }
}

module.exports = UpdateStats;
