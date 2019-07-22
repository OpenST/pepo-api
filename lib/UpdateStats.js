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

    const updateResponse = await new VideoContributorModel().updateByVideoIdAndContributedByUserId({
      videoId: oThis.videoId,
      contributedByUserId: oThis.fromUserId,
      totalAmount: oThis.totalAmount
    });

    if (updateResponse.changedRows === 0) {
      // Create video contributors.
      await new VideoContributorModel().insertVideoContributor({
        videoId: oThis.videoId,
        contributedByUserId: oThis.fromUserId,
        totalAmount: oThis.totalAmount
      });

      oThis.existingVideoContributor = false;
    }
    // todo: if insert index violation use update with sleep

    // Flush cache.
    await VideoContributorModel.flushCache({ contributedByUserId: oThis.fromUserId, videoIds: [oThis.videoId] });
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
      updateResponse = await new VideoDetailsModel().updateByVideoId({
        videoId: oThis.videoId,
        totalAmount: oThis.totalAmount,
        totalContributedBy: 0
      });
    } else {
      updateResponse = await new VideoDetailsModel().updateByVideoId({
        videoId: oThis.videoId,
        totalAmount: oThis.totalAmount,
        totalContributedBy: 1
      });
    }

    if (updateResponse.changedRows === 0) {
      logger.error('Video details should have entry.');
      //  todo: error rejection
    }
    // Flush cache.
    await VideoDetailsModel.flushCache({ userId: oThis.toUserId, videoIds: [oThis.videoId] });
  }

  /**
   * Update user contributor.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserContributors() {
    const oThis = this;

    const updateResponse = await new UserContributorModel().updateByUserIdAndContributedByUserId({
      userId: oThis.toUserId,
      contributedByUserId: oThis.fromUserId,
      totalAmount: oThis.totalAmount
    });

    // Create user contributors, if row doesn't exist.
    if (updateResponse.changedRows === 0) {
      oThis.existingUserContributor = false;

      const insertResponse = await new UserContributorModel().insertUserContributor({
        userId: oThis.toUserId,
        contributedByUserId: oThis.fromUserId,
        totalAmount: oThis.totalAmount
      });
    }
    //todo: use insertOnduplicate if insert is the second choice and there is no decisionMaking based on insert/update here

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
    await new UserStatModel().updateUserStat({
      userId: oThis.toUserId,
      totalContributedBy: 0,
      totalContributedTo: 0,
      totalAmountRaised: oThis.totalAmount
    });

    //todo: if changedRows ==0 send an error mail with debug data
    // Flush cache.
    await UserStatModel.flushCache({ userIds: [oThis.toUserId] });
  }

  /**
   * Update user stats.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createUserStats() {
    const oThis = this;

    //todo: Insert is the first preference here?

    // Create user stat for fromUserId.
    await new UserStatModel()
      .createUserStat({
        userId: oThis.fromUserId,
        totalContributedBy: 0,
        totalContributedTo: 1,
        totalAmountRaised: 0
      })
      .catch(async function(error) {
        logger.error('In catch block . Error: ', error);

        // Update user stat for fromUserId.
        await new UserStatModel().updateUserStat({
          userId: oThis.fromUserId,
          totalContributedBy: 0,
          totalContributedTo: 1,
          totalAmountRaised: 0
        });
      });

    // Create user stat for toUserId.
    await new UserStatModel()
      .createUserStat({
        userId: oThis.toUserId,
        totalContributedBy: 1,
        totalContributedTo: 0,
        totalAmountRaised: oThis.totalAmount
      })
      .catch(async function(error) {
        logger.error('In catch block . Error: ', error);

        // Update user stat for toUserId.
        await new UserStatModel().updateUserStat({
          userId: oThis.toUserId,
          totalContributedBy: 1,
          totalContributedTo: 0,
          totalAmountRaised: oThis.totalAmount
        });
      });

    // todo: update if index violation else reject

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

    await new TwitterUserConnectionModel().updateTwitterUserConnection({
      twitterUser1Id: fromTwitterUserId,
      twitterUser2Id: toTwitterUserId,
      propertiesVal: propertyVal
    });
  }
}

module.exports = UpdateStats;
