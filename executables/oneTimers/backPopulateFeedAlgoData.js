const rootPrefix = '../..',
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  UserContributorModel = require(rootPrefix + '/app/models/mysql/UserContributor'),
  UserActionDetailModel = require(rootPrefix + '/app/models/cassandra/UserActionDetail'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  VideoCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  ReplyDetailsByEntityIdsAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  userActionDetailConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userActionDetail'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class BackPopulateFeedAlgoData {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._updateVideoOrReplyContributionTime();
    await oThis._updateFeedLastReplyTime();
    await oThis._updateAuthorContributionTime();
    await oThis._updateLastReplyTime();
  }

  async _updateVideoOrReplyContributionTime() {
    const oThis = this;

    const tableName = new UserActionDetailModel().queryTableName,
      videoQuery = `UPDATE ${tableName} set l_v_c_t = ? where u_id=? and e_i = ? `,
      replyQuery = `UPDATE ${tableName} set l_r_c_t = ? where u_id=? and e_i = ? `;

    let queries = [],
      limit = 100,
      offset = 0;

    let replyQueryData = {};

    while (true) {
      const dbRows = await new VideoContributorModel()
        .select('video_id, contributed_by_user_id, max(created_at) as created_at')
        .order_by('video_id, contributed_by_user_id desc')
        .group_by('video_id, contributed_by_user_id')
        .limit(limit)
        .offset(offset)
        .fire();

      offset = offset + limit;

      if (dbRows.length === 0) {
        break;
      }

      let ids = [],
        videoIds = [],
        replyVideoIds = [],
        replyVideoIdToParentVideoMap = {};

      for (let i = 0; i < dbRows.length; i++) {
        ids.push(dbRows[i].video_id);
      }

      const videoDetailsCacheResponse = await new VideoCacheKlass({ ids: ids }).fetch();

      if (videoDetailsCacheResponse.isFailure()) {
        logger.error('Error while fetching video detail data.');
        return Promise.reject(videoDetailsCacheResponse);
      }

      for (let videoId in videoDetailsCacheResponse.data) {
        let video = videoDetailsCacheResponse.data[videoId];

        if (video.kind == videoConstants.postVideoKind) {
          videoIds.push(videoId);
        } else {
          replyVideoIds.push(videoId);
        }
      }

      if (replyVideoIds.length > 0) {
        const replyDetailsByEntityIdsAndEntityKindCacheRsp = await new ReplyDetailsByEntityIdsAndEntityKindCache({
          entityIds: replyVideoIds,
          entityKind: replyDetailConstants.videoEntityKind
        }).fetch();

        if (replyDetailsByEntityIdsAndEntityKindCacheRsp.isFailure()) {
          logger.error('Error while fetching reply detail data.');
          return Promise.reject(replyDetailsByEntityIdsAndEntityKindCacheRsp);
        }

        const replyDetailIds = [];

        for (let videoId in replyDetailsByEntityIdsAndEntityKindCacheRsp.data) {
          replyDetailIds.push(replyDetailsByEntityIdsAndEntityKindCacheRsp.data[videoId].id);
        }

        const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: replyDetailIds }).fetch();

        if (replyDetailCacheResp.isFailure()) {
          logger.error('Error while fetching reply detail data.');
          return Promise.reject(replyDetailCacheResp);
        }

        for (let replyDetailId in replyDetailCacheResp.data) {
          let replyDetail = replyDetailCacheResp.data[replyDetailId];
          replyVideoIdToParentVideoMap[replyDetail.entityId] = replyDetail.parentId;
        }
      }

      for (let i = 0; i < dbRows.length; i++) {
        const dbRow = dbRows[i];
        const videoId = dbRow.video_id,
          userId = dbRow.contributed_by_user_id,
          parentVideoId = replyVideoIdToParentVideoMap[videoId];

        if (parentVideoId) {
          replyQueryData[parentVideoId] = replyQueryData[parentVideoId] || {};
          replyQueryData[parentVideoId][userId] = replyQueryData[parentVideoId][userId] || {
            max_created_at: 0
          };

          if (replyQueryData[parentVideoId][userId]['max_created_at'] < dbRow.created_at) {
            replyQueryData[parentVideoId][userId]['max_created_at'] = dbRow.created_at;
          }
        } else {
          if (videoIds.indexOf(dbRow.video_id) === -1) {
            Promise.reject(`INVALID Video ID-`, dbRow.video_id);
          }

          let entityIdentifier = userActionDetailConstants.createEntityIdentifier(
            userActionDetailConstants.videoEntityKind,
            dbRow.video_id
          );

          const updateParam = [dbRow.created_at * 1000, userId, entityIdentifier];
          queries.push({ query: videoQuery, params: updateParam });
        }
      }
    }

    for (let parentId in replyQueryData) {
      for (let userId in replyQueryData[parentId]) {
        const dbRow = replyQueryData[parentId][userId];
        let entityIdentifier = userActionDetailConstants.createEntityIdentifier(
          userActionDetailConstants.videoEntityKind,
          parentId
        );

        const updateParam = [dbRow.max_created_at * 1000, userId, entityIdentifier];
        queries.push({ query: replyQuery, params: updateParam });
      }
    }

    while (queries.length > 0) {
      let batchQueries = queries.splice(0, limit);
      await new UserActionDetailModel().batchFire(batchQueries);
    }
  }

  async _updateLastReplyTime() {
    const oThis = this;

    const tableName = new UserActionDetailModel().queryTableName,
      query = `UPDATE ${tableName} set l_r_t = ? where u_id=? and e_i = ? `;

    let queries = [],
      limit = 100,
      offset = 0;

    const dbRows = await new ReplyDetailsModel()
      .select('parent_id, creator_user_id, max(created_at) as reply_time')
      .group_by('parent_id, creator_user_id')
      .fire();

    offset = offset + limit;

    for (let i = 0; i < dbRows.length; i++) {
      const dbRow = dbRows[i];

      let entityIdentifier = userActionDetailConstants.createEntityIdentifier(
        userActionDetailConstants.videoEntityKind,
        dbRow.parent_id
      );

      const updateParam = [dbRow.reply_time * 1000, dbRow.creator_user_id, entityIdentifier];
      queries.push({ query: query, params: updateParam });
    }

    while (queries.length > 0) {
      let batchQueries = queries.splice(0, limit);
      await new UserActionDetailModel().batchFire(batchQueries);
    }
  }

  async _updateAuthorContributionTime() {
    const oThis = this;

    const tableName = new UserActionDetailModel().queryTableName,
      query = `UPDATE ${tableName} set u_c_t = ? where u_id=? and e_i = ? `;

    let queries = [],
      limit = 100,
      offset = 0;

    while (true) {
      const dbRows = await new UserContributorModel()
        .select('user_id, contributed_by_user_id, created_at')
        .order_by('id asc')
        .limit(limit)
        .offset(offset)
        .fire();

      offset = offset + limit;

      if (dbRows.length === 0) {
        break;
      }

      for (let i = 0; i < dbRows.length; i++) {
        const dbRow = dbRows[i];

        let entityIdentifier = userActionDetailConstants.createEntityIdentifier(
          userActionDetailConstants.userEntityKind,
          dbRow.user_id
        );

        const updateParam = [dbRow.created_at * 1000, dbRow.contributed_by_user_id, entityIdentifier];
        queries.push({ query: query, params: updateParam });
      }
    }

    while (queries.length > 0) {
      let batchQueries = queries.splice(0, limit);
      await new UserActionDetailModel().batchFire(batchQueries);
    }
  }

  async _updateFeedLastReplyTime() {
    const oThis = this;

    const dbRows = await new ReplyDetailsModel()
      .select('parent_id, max(created_at) as reply_time')
      .group_by('parent_id')
      .where('status != 1')
      .fire();

    //Todo:  populate feed - is popular.???

    let promises = [];
    for (let i = 0; i < dbRows.length; i++) {
      const dbRow = dbRows[i];

      let resp = new FeedModel()
        .update({ last_reply_timestamp: dbRow.reply_time })
        .where({ primary_external_entity_id: dbRow.parent_id })
        .fire();

      promises.push(resp);
      if (promises.length > 10) {
        await Promise.all(promises);
        promises = [];
      }
    }
    await Promise.all(promises);
  }
}

new BackPopulateFeedAlgoData()
  .perform()
  .then(function() {
    logger.win('All FeedAlgoData table back-populated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });
