const rootPrefix = '..',
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  UserContributorModel = require(rootPrefix + '/app/models/mysql/UserContributor'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
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

    //NOTE: Function first tries to update. If update is failed then it inserts. If insert faces duplicate index violation. Then update is called.

    const updateResponse = await new VideoContributorModel().updateByVideoIdAndContributedByUserId({
      videoId: oThis.videoId,
      contributedByUserId: oThis.fromUserId,
      totalAmount: oThis.totalAmount
    });

    if (updateResponse.changedRows === 0) {
      oThis.existingVideoContributor = false;
      // Create video contributors.
      await new VideoContributorModel()
        .insertVideoContributor({
          videoId: oThis.videoId,
          contributedByUserId: oThis.fromUserId,
          totalAmount: oThis.totalAmount
        })
        .catch(async function(err) {
          if (
            VideoContributorModel.isDuplicateIndexViolation(
              VideoContributorModel.videoIdContributedByUniqueIndexName,
              err
            )
          ) {
            basicHelper.sleep(200);
            await new VideoContributorModel().updateByVideoIdAndContributedByUserId({
              videoId: oThis.videoId,
              contributedByUserId: oThis.fromUserId,
              totalAmount: oThis.totalAmount
            });
            oThis.existingVideoContributor = true;
          } else {
            let errorObject = responseHelper.error({
              internal_error_identifier: 'l_us_2',
              api_error_identifier: 'something_went_wrong',
              debug_options: { Error: err.toString() }
            });
            createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
            return Promise.reject(errorObject);
          }
        });
    }

    await VideoContributorModel.flushCache({ contributedByUserId: oThis.fromUserId, videoId: oThis.videoId });
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
      let errorObject = responseHelper.error({
        internal_error_identifier: 'l_us_3',
        api_error_identifier: 'something_went_wrong',
        debug_options: { Reason: 'Video not found in video details table', videoId: oThis.videoId }
      });
      createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
      return Promise.reject(errorObject);
    }

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

    const updateResponse = await new UserContributorModel().updateByUserIdAndContributedByUserId({
      userId: oThis.toUserId,
      contributedByUserId: oThis.fromUserId,
      totalAmount: oThis.totalAmount
    });

    // Create user contributors, if row doesn't exist.
    if (updateResponse.changedRows === 0) {
      oThis.existingUserContributor = false;

      const insertResponse = await new UserContributorModel()
        .insertUserContributor({
          userId: oThis.toUserId,
          contributedByUserId: oThis.fromUserId,
          totalAmount: oThis.totalAmount
        })
        .catch(async function(err) {
          if (
            UserContributorModel.isDuplicateIndexViolation(UserContributorModel.userIdContributedByUniqueIndexName, err)
          ) {
            basicHelper.sleep(200);
            await new UserContributorModel().updateByUserIdAndContributedByUserId({
              userId: oThis.toUserId,
              contributedByUserId: oThis.fromUserId,
              totalAmount: oThis.totalAmount
            });
            oThis.existingUserContributor = true;
          } else {
            let errorObject = responseHelper.error({
              internal_error_identifier: 'l_us_4',
              api_error_identifier: 'something_went_wrong',
              debug_options: { Error: err.toString() }
            });
            createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
            return Promise.reject(errorObject);
          }
        });
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
    const updateResponse = await new UserStatModel().updateUserStat({
      userId: oThis.toUserId,
      totalContributedBy: 0,
      totalContributedTo: 0,
      totalAmountRaised: oThis.totalAmount
    });

    if (updateResponse.changedRows === 0) {
      let errorObject = responseHelper.error({
        internal_error_identifier: 'l_us_5',
        api_error_identifier: 'something_went_wrong',
        debug_options: { Reason: 'User stats not updated for given user id.', userId: oThis.toUserId }
      });
      createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
      return Promise.reject(errorObject);
    }

    await UserStatModel.flushCache({ userId: oThis.toUserId });
  }

  /**
   * Update user stats.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createUserStats() {
    const oThis = this;

    const updateResponse = await new UserStatModel().updateUserStat({
      userId: oThis.fromUserId,
      totalContributedBy: 0,
      totalContributedTo: 1,
      totalAmountRaised: 0
    });

    if (updateResponse.changedRows === 0) {
      await new UserStatModel()
        .createUserStat({
          userId: oThis.fromUserId,
          totalContributedBy: 0,
          totalContributedTo: 1,
          totalAmountRaised: 0
        })
        .catch(async function(err) {
          if (UserStatModel.isDuplicateIndexViolation(UserStatModel.userIdUniqueIndexName, err)) {
            await new UserStatModel().updateUserStat({
              userId: oThis.fromUserId,
              totalContributedBy: 0,
              totalContributedTo: 1,
              totalAmountRaised: 0
            });
          } else {
            let errorObject = responseHelper.error({
              internal_error_identifier: 'l_us_6',
              api_error_identifier: 'something_went_wrong',
              debug_options: { Reason: 'User stats not updated for given user id.', userId: oThis.fromUserId }
            });
            createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
            return Promise.reject(errorObject);
          }
        });
    }

    let updateResponseFromUserId = await new UserStatModel().updateUserStat({
      userId: oThis.toUserId,
      totalContributedBy: 1,
      totalContributedTo: 0,
      totalAmountRaised: oThis.totalAmount
    });

    if (updateResponseFromUserId.changedRows === 0) {
      await new UserStatModel()
        .createUserStat({
          userId: oThis.toUserId,
          totalContributedBy: 1,
          totalContributedTo: 0,
          totalAmountRaised: oThis.totalAmount
        })
        .catch(async function(err) {
          if (UserStatModel.isDuplicateIndexViolation(UserStatModel.userIdUniqueIndexName, err)) {
            await new UserStatModel().updateUserStat({
              userId: oThis.toUserId,
              totalContributedBy: 1,
              totalContributedTo: 0,
              totalAmountRaised: oThis.totalAmount
            });
          } else {
            let errorObject = responseHelper.error({
              internal_error_identifier: 'l_us_7',
              api_error_identifier: 'something_went_wrong',
              debug_options: { Reason: 'User stats not updated for given user id.', userId: oThis.toUserId }
            });
            createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
            return Promise.reject(errorObject);
          }
        });
    }
    // todo: Flush cache. change
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

    //  todo: flush cache
  }
}

module.exports = UpdateStats;
