const BigNumber = require('bignumber.js');

const rootPrefix = '..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  UserContributorModel = require(rootPrefix + '/app/models/mysql/UserContributor'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  UserActionDetailModel = require(rootPrefix + '/app/models/cassandra/UserActionDetail'),
  UserStatByUserIds = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  DynamicVariablesByKindCache = require(rootPrefix + '/lib/cacheManagement/multi/DynamicVariablesByKind'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  dynamicVariableConstants = require(rootPrefix + '/lib/globalConstant/big/dynamicVariables'),
  userActionDetailConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userActionDetail'),
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
   * @param {number} [params.replyDetailId] - Reply detail id
   * @param {number} [params.parentVideoId] - Parent Video id
   * @param {number} params.totalAmount - Total amount
   */
  constructor(params) {
    const oThis = this;

    oThis.fromUserId = params.fromUserId;
    oThis.toUserId = params.toUserId;
    oThis.videoId = params.videoId;
    oThis.replyDetailId = params.replyDetailId;
    oThis.parentVideoId = params.parentVideoId;
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

      if (oThis.replyDetailId) {
        promiseArray.push(oThis._updateReplyDetails());
      } else {
        await oThis._fetchVideoDetails();
        promiseArray.push(oThis._updateVideoDetails());
        promiseArray.push(oThis._markFeedPopularIfEligible());
      }

      promiseArray.push(oThis._updateUserActionDetailsForVideoKind());
    }

    promiseArray.push(oThis._updateUserContributors());

    await Promise.all(promiseArray);

    if (oThis.existingUserContributor) {
      promiseArray.push(oThis._updateUserStats());
    } else {
      promiseArray.push(oThis._createUserStats());
      promiseArray.push(oThis._updateUserActionDetailsForUserKind());
      promiseArray.push(oThis._updateTwitterUserConnection());
    }

    await Promise.all(promiseArray);

    logger.log('Total time : ', Date.now() - currentTime);
  }

  /**
   * Fetch video details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      logger.error('Error while fetching video detail data.');

      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetails = videoDetailsCacheResponse.data[oThis.videoId];
  }

  /**
   * Mark feed popular if eligible
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markFeedPopularIfEligible() {
    const oThis = this;

    const dynamicThreshold = await oThis._dynamicPopularityThreshold();
    if (
      dynamicThreshold &&
      new BigNumber(oThis.videoDetails.totalAmount)
        .plus(new BigNumber(oThis.totalAmount))
        .gte(new BigNumber(dynamicThreshold))
    ) {
      const feedResp = await new FeedModel()
        .select('*')
        .where({
          primary_external_entity_id: oThis.videoId,
          kind: feedConstants.invertedKinds[feedConstants.fanUpdateKind]
        })
        .fire();

      if (feedResp[0] && feedResp[0].id) {
        const formattedFeedRow = new FeedModel().formatDbData(feedResp[0]);

        if (formattedFeedRow.isPopular === 0) {
          const feedId = formattedFeedRow.id;

          await new FeedModel()
            .update({ is_popular: 1 })
            .where({ id: feedId })
            .fire();

          await FeedModel.flushCache({ ids: [feedId] });
        }
      }
    }
  }

  /**
   * Checks if the parent video is popular
   *
   * @returns {Promise<void>}
   * @private
   */
  async _dynamicPopularityThreshold() {
    const cacheResponse = await new DynamicVariablesByKindCache({
      kinds: [dynamicVariableConstants.pepoValuePopularityThreshold]
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const popularityDynamicVariables = cacheResponse.data;

    if (popularityDynamicVariables[dynamicVariableConstants.pepoValuePopularityThreshold].value) {
      return popularityDynamicVariables[dynamicVariableConstants.pepoValuePopularityThreshold].value;
    }

    return null;
  }

  /**
   * Update User Action Details for video Kind.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserActionDetailsForUserKind() {
    const oThis = this;

    //Note: Use current time or Tx Time?

    //  is reply contribution
    const updateParams = {
      userId: oThis.fromUserId,
      entityKind: userActionDetailConstants.userEntityKind,
      entityId: oThis.toUserId,
      updateParams: {
        userContributionTimestamp: Date.now()
      }
    };

    return new UserActionDetailModel().updateRow(updateParams);
  }

  /**
   * Update User Action Details for video Kind.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserActionDetailsForVideoKind() {
    const oThis = this;

    //Note: Use current time or Tx Time?

    if (oThis.replyDetailId) {
      //  is reply contribution
      const updateParams = {
        userId: oThis.fromUserId,
        entityKind: userActionDetailConstants.videoEntityKind,
        entityId: oThis.parentVideoId,
        updateParams: {
          lastReplyContributionTimestamp: Date.now()
        }
      };

      await new UserActionDetailModel().updateRow(updateParams);
    } else if (oThis.videoId) {
      //  is video contribution
      const updateParams = {
        userId: oThis.fromUserId,
        entityKind: userActionDetailConstants.videoEntityKind,
        entityId: oThis.videoId,
        updateParams: {
          lastVideoContributionTimestamp: Date.now()
        }
      };

      await new UserActionDetailModel().updateRow(updateParams);
    } else {
      //  is user contribution
      //  Do Nothing here. Update is above methods
    }
  }

  /**
   * Update video contributors.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoContributors() {
    const oThis = this;

    // NOTE: Function first tries to update. If update is failed then it inserts. If insert faces duplicate index violation. Then update is called.

    const updateResponse = await new VideoContributorModel().updateByVideoIdAndContributedByUserId({
      videoId: oThis.videoId,
      contributedByUserId: oThis.fromUserId,
      totalAmount: oThis.totalAmount
    });

    if (updateResponse.affectedRows === 0) {
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
            await basicHelper.sleep(200);
            await new VideoContributorModel().updateByVideoIdAndContributedByUserId({
              videoId: oThis.videoId,
              contributedByUserId: oThis.fromUserId,
              totalAmount: oThis.totalAmount
            });
            oThis.existingVideoContributor = true;
          } else {
            const errorObject = responseHelper.error({
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

    const updateResponse = await new VideoDetailsModel().updateByVideoId({
      videoId: oThis.videoId,
      totalAmount: oThis.totalAmount,
      totalContributedBy: oThis.existingVideoContributor ? 0 : 1
    });

    if (updateResponse.affectedRows === 0) {
      logger.error('Video details should have entry.');
      const errorObject = responseHelper.error({
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
   * Update reply details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateReplyDetails() {
    const oThis = this;

    const updateResponse = await new ReplyDetailsModel().updateByReplyDetailId({
      replyDetailId: oThis.replyDetailId,
      totalAmount: oThis.totalAmount,
      totalContributedBy: oThis.existingVideoContributor ? 0 : 1
    });

    if (updateResponse.affectedRows === 0) {
      logger.error('Reply details should have entry.');
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_us_8',
        api_error_identifier: 'something_went_wrong',
        debug_options: { Reason: 'Reply not found in reply details table', replyDetailId: oThis.replyDetailId }
      });
      createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }
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
    if (updateResponse.affectedRows === 0) {
      oThis.existingUserContributor = false;

      await new UserContributorModel()
        .insertUserContributor({
          userId: oThis.toUserId,
          contributedByUserId: oThis.fromUserId,
          totalAmount: oThis.totalAmount
        })
        .catch(async function(err) {
          if (
            UserContributorModel.isDuplicateIndexViolation(UserContributorModel.userIdContributedByUniqueIndexName, err)
          ) {
            await basicHelper.sleep(200);
            await new UserContributorModel().updateByUserIdAndContributedByUserId({
              userId: oThis.toUserId,
              contributedByUserId: oThis.fromUserId,
              totalAmount: oThis.totalAmount
            });
            oThis.existingUserContributor = true;
          } else {
            const errorObject = responseHelper.error({
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
    await UserContributorModel.flushCache(
      { contributedByUserId: oThis.fromUserId, userId: oThis.toUserId },
      { isInsert: true }
    );
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
      totalAmountRaised: oThis.totalAmount,
      totalAmountSpent: 0
    });

    if (updateResponse.affectedRows === 0) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_us_5',
        api_error_identifier: 'something_went_wrong',
        debug_options: { Reason: 'User stats not updated for given user id.', userId: oThis.toUserId }
      });
      createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    // Update user stat for fromUserId.
    const updateResponse2 = await new UserStatModel().updateUserStat({
      userId: oThis.fromUserId,
      totalContributedBy: 0,
      totalContributedTo: 0,
      totalAmountRaised: 0,
      totalAmountSpent: oThis.totalAmount
    });

    if (updateResponse2.changedRows === 0) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_us_6',
        api_error_identifier: 'something_went_wrong',
        debug_options: { Reason: 'User stats not updated for given user id.', fromUserId: oThis.fromUserId }
      });
      createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    // Flush cache.
    await new UserStatByUserIds({
      userIds: [oThis.fromUserId, oThis.toUserId]
    }).clear();
  }

  /**
   * Update user stats.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createUserStats() {
    const oThis = this;

    const fromUserIdParams = {
      userId: oThis.fromUserId,
      totalContributedBy: 0,
      totalContributedTo: 1,
      totalAmountRaised: 0,
      totalAmountSpent: oThis.totalAmount
    };

    await UserStatModel.updateOrCreateUserStat(fromUserIdParams);

    const toUserIdParams = {
      userId: oThis.toUserId,
      totalContributedBy: 1,
      totalContributedTo: 0,
      totalAmountRaised: oThis.totalAmount,
      totalAmountSpent: 0
    };

    await UserStatModel.updateOrCreateUserStat(toUserIdParams);

    // Flush cache.
    await new UserStatByUserIds({
      userIds: [oThis.fromUserId, oThis.toUserId]
    }).clear();
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

    // From user id and to user id should be twitter user,
    // then only twitter user connections will be updated.
    if (twitterUserCacheRsp.data[oThis.fromUserId].id && twitterUserCacheRsp.data[oThis.toUserId].id) {
      const fromTwitterUserId = twitterUserCacheRsp.data[oThis.fromUserId].id,
        toTwitterUserId = twitterUserCacheRsp.data[oThis.toUserId].id,
        propertyVal =
          twitterUserConnectionConstants.invertedProperties[
            twitterUserConnectionConstants.isTwitterUser2ContributedToProperty
          ];

      const updateTwitterUserConnectionResp = await new TwitterUserConnectionModel().updateTwitterUserConnection({
        twitterUser1Id: fromTwitterUserId,
        twitterUser2Id: toTwitterUserId,
        propertiesVal: propertyVal
      });

      logger.log('propertyVal ======', propertyVal);
      logger.log('updateTwitterUserConnectionResp ======', updateTwitterUserConnectionResp);

      if (updateTwitterUserConnectionResp.affectedRows !== 0) {
        await TwitterUserConnectionModel.flushCache({
          twitterUser1Id: fromTwitterUserId,
          twitterUser2Id: toTwitterUserId
        });
      }
    }
  }
}

module.exports = UpdateStats;
