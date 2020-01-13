const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  UserContributorModel = require(rootPrefix + '/app/models/mysql/UserContributor'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  UserMuteModel = require(rootPrefix + '/app/models/mysql/UserMute'),
  UserRelationModel = require(rootPrefix + '/app/models/mysql/UserRelation'),
  PostArangoModel = require(rootPrefix + '/app/models/arango/Post'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  videoDetailConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  userArangoConstants = require(rootPrefix + '/lib/globalConstant/arango/user'),
  videoArangoConstants = require(rootPrefix + '/lib/globalConstant/arango/video'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCHSIZE = 200;

class BackPopulateGraphData {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._getUsers();
    await oThis._getVideos();
    await oThis._getFollowData();
  }

  /**
   * Get follow data.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getFollowData() {
    const oThis = this;

    const followRowsForArango = [
      ['_from', '_to', 'is_contributor', 'is_twitter_follower', 'is_muted', 'is_blocked', 'is_feed_follower']
    ];

    const activeUserMap = {},
      userFollowData = {};

    const dbRows = await new UserModel()
      .select('id')
      .where({ status: userConstants.invertedStatuses[userConstants.activeStatus] })
      .fire();

    for (let i = 0; i < dbRows.length; i++) {
      activeUserMap[dbRows[i].id] = 1;
    }

    {
      let offset = 0;

      while (true) {
        offset = offset + BATCHSIZE;

        const dbRows = await new UserContributorModel()
          .select('user_id, contributed_by_user_id')
          .order_by('id ASC')
          .limit(BATCHSIZE)
          .offset(offset)
          .fire();

        if (dbRows.length === 0) {
          break;
        } else {
          for (let i = 0; i < dbRows.length; i++) {
            const userContributorObj = new UserContributorModel().formatDbData(dbRows[i]);
            userFollowData[userContributorObj.contributedByUserId] =
              userFollowData[userContributorObj.contributedByUserId] || {};
            userFollowData[userContributorObj.contributedByUserId][userContributorObj.userId] =
              userFollowData[userContributorObj.contributedByUserId][userContributorObj.userId] || {};
            userFollowData[userContributorObj.contributedByUserId][userContributorObj.userId]['isContributor'] = 1;
          }
        }
      }
    }

    {
      let offset = 0;

      while (true) {
        offset = offset + BATCHSIZE;

        const dbRows = await new UserMuteModel()
          .select('user1_id, user2_id')
          .where('user1_id > 0')
          .order_by('id ASC')
          .limit(BATCHSIZE)
          .offset(offset)
          .fire();

        if (dbRows.length === 0) {
          break;
        } else {
          for (let i = 0; i < dbRows.length; i++) {
            const userMuteObj = new UserMuteModel().formatDbData(dbRows[i]);
            userFollowData[userMuteObj.user1Id] = userFollowData[userMuteObj.user1Id] || {};
            userFollowData[userMuteObj.user1Id][userMuteObj.user2Id] =
              userFollowData[userMuteObj.user1Id][userMuteObj.user2Id] || {};
            userFollowData[userMuteObj.user1Id][userMuteObj.user2Id]['isMuted'] = 1;
          }
        }
      }
    }

    {
      let offset = 0;

      while (true) {
        offset = offset + BATCHSIZE;

        const dbRows = await new UserRelationModel()
          .select('user1_id, user2_id')
          .where('relations = 1')
          .order_by('id ASC')
          .limit(BATCHSIZE)
          .offset(offset)
          .fire();

        if (dbRows.length === 0) {
          break;
        } else {
          for (let i = 0; i < dbRows.length; i++) {
            const userRelationObj = new UserRelationModel().formatDbData(dbRows[i]);
            userFollowData[userRelationObj.user1Id] = userFollowData[userRelationObj.user1Id] || {};
            userFollowData[userRelationObj.user1Id][userRelationObj.user2Id] =
              userFollowData[userRelationObj.user1Id][userRelationObj.user2Id] || {};
            userFollowData[userRelationObj.user1Id][userRelationObj.user2Id]['isBlocked'] = 1;

            userFollowData[userRelationObj.user2Id] = userFollowData[userRelationObj.user2Id] || {};
            userFollowData[userRelationObj.user2Id][userRelationObj.user1Id] =
              userFollowData[userRelationObj.user2Id][userRelationObj.user1Id] || {};
            userFollowData[userRelationObj.user2Id][userRelationObj.user1Id]['isBlocked'] = 1;
          }
        }
      }
    }

    const twitterIdToUserIdMap = {};
    {
      let offset = 0;

      while (true) {
        offset = offset + BATCHSIZE;

        const dbRows = await new TwitterUserModel()
          .select('user_id, id')
          .where('user_id >0')
          .order_by('id ASC')
          .limit(BATCHSIZE)
          .offset(offset)
          .fire();

        if (dbRows.length === 0) {
          break;
        } else {
          for (let i = 0; i < dbRows.length; i++) {
            const tuObj = new TwitterUserModel().formatDbData(dbRows[i]);
            twitterIdToUserIdMap[tuObj.id] = tuObj.userId;
          }
        }
      }
    }

    {
      let offset = 0;

      while (true) {
        offset = offset + BATCHSIZE;

        const dbRows = await new TwitterUserConnectionModel()
          .select('twitter_user1_id, twitter_user2_id')
          .where('properties >0')
          .order_by('id ASC')
          .limit(BATCHSIZE)
          .offset(offset)
          .fire();

        if (dbRows.length === 0) {
          break;
        } else {
          for (let i = 0; i < dbRows.length; i++) {
            const TwitterUserConnectionObj = new TwitterUserConnectionModel().formatDbData(dbRows[i]);
            const user1Id = twitterIdToUserIdMap[TwitterUserConnectionObj.twitterUser1Id],
              user2Id = twitterIdToUserIdMap[TwitterUserConnectionObj.twitterUser2Id];

            userFollowData[user1Id] = userFollowData[user1Id] || {};
            userFollowData[user1Id][user2Id] = userFollowData[user1Id][user2Id] || {};
            userFollowData[user1Id][user2Id]['isTwitterFollower'] = 1;
          }
        }
      }
    }

    for (let user1Id in userFollowData) {
      for (let user2Id in userFollowData[user1Id]) {
        let data = userFollowData[user1Id][user2Id];
        followRowsForArango.push([
          user1Id,
          user2Id,
          data['isContributor'] || false,
          data['isTwitterFollower'] || false,
          data['isMuted'] || false,
          data['isBlocked'] || false,
          (data['isContributor'] || data['isTwitterFollower'] || false) &&
            !(data['isMuted'] || data['isBlocked'] || false)
        ]);
      }
    }
  }

  /**
   * Get users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUsers() {
    const oThis = this;

    const userRowsForArango = [['_key', 'status', 'created_at']];

    let offset = 0;

    while (true) {
      offset = offset + BATCHSIZE;

      const dbRows = await new UserModel()
        .select('*')
        .where({ status: userConstants.invertedStatuses[userConstants.activeStatus] })
        .order_by('id ASC')
        .limit(BATCHSIZE)
        .offset(offset)
        .fire();

      if (dbRows.length === 0) {
        return;
      } else {
        for (let i = 0; i < dbRows.length; i++) {
          const userObj = new UserModel().formatDbData(dbRows[i]);
          userRowsForArango.push([
            userObj.id,
            userArangoConstants.invertedStatuses[userArangoConstants.activeStatus],
            userObj.createdAt
          ]);
        }
      }
    }
  }

  /**
   * Get users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getVideos() {
    const oThis = this;

    const videoRowsForArango = [['_key', 'status', 'created_at']];
    const postRowsForArango = [['_from', '_to', 'posted_at']];

    const postFromCollectionName = new PostArangoModel().fromCollectionName;
    const postToCollectionName = new PostArangoModel().toCollectionName;

    let offset = 0;

    while (true) {
      offset = offset + BATCHSIZE;

      const dbRows = await new VideoDetailModel()
        .select('*')
        .where({ status: videoDetailConstants.invertedStatuses[videoDetailConstants.activeStatus] })
        .order_by('id ASC')
        .limit(BATCHSIZE)
        .offset(offset)
        .fire();

      if (dbRows.length === 0) {
        return;
      } else {
        for (let i = 0; i < dbRows.length; i++) {
          const videoDetailObj = new VideoDetailModel().formatDbData(dbRows[i]);

          videoRowsForArango.push([
            videoDetailObj.videoId,
            videoArangoConstants.invertedStatuses[videoArangoConstants.activeStatus],
            videoDetailObj.createdAt
          ]);

          postRowsForArango.push([
            `${postFromCollectionName}/${videoDetailObj.creatorUserId}`,
            `${postToCollectionName}/${videoDetailObj.videoId}`,
            videoDetailObj.createdAt
          ]);
        }
      }
    }
  }
}

new BackPopulateGraphData()
  .perform()
  .then(function() {
    logger.win('All rows back-populated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });
