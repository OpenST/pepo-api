const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for video detail model.
 *
 * @class VideoDetail
 */
class VideoDetail extends ModelBase {
  /**
   * Constructor for video detail model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_details';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.creator_user_id
   * @param {number} dbRow.video_id
   * @param {number} dbRow.description_id
   * @param {string} dbRow.link_ids
   * @param {number} dbRow.total_contributed_by
   * @param {number} dbRow.total_amount
   * @param {number} dbRow.per_reply_amount_in_wei
   * @param {number} dbRow.total_replies
   * @param {number} dbRow.total_transactions
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      creatorUserId: dbRow.creator_user_id,
      videoId: dbRow.video_id,
      descriptionId: dbRow.description_id,
      linkIds: dbRow.link_ids ? JSON.parse(dbRow.link_ids) : null,
      totalContributedBy: dbRow.total_contributed_by,
      totalAmount: dbRow.total_amount,
      perReplyAmountInWei: dbRow.per_reply_amount_in_wei,
      totalReplies: dbRow.total_replies,
      totalTransactions: dbRow.total_transactions,
      status: videoDetailsConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'creatorUserId',
      'videoId',
      'descriptionId',
      'linkIds',
      'totalContributedBy',
      'totalTransactions',
      'totalAmount',
      'perReplyAmountInWei',
      'totalReplies',
      'status',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Fetch videoDetail object for video id.
   *
   * @param {array<integer>} userIds: User Ids.
   *
   * @returns Promise{object}
   */
  async fetchLatestVideoId(userIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('creator_user_id, max(video_id) as latest_video_id')
      .where({
        creator_user_id: userIds,
        status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus]
      })
      .group_by(['creator_user_id'])
      .fire();

    const response = {};

    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];
      response[userId] = {};
    }

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];
      response[dbRow.creator_user_id] = { latestVideoId: dbRow.latest_video_id };
    }

    return response;
  }

  /**
   * Fetch all videoDetail objects for user ids.
   *
   * @param {array<integer>} userIds: User Ids.
   *
   * @returns Promise{object}
   */
  async fetchVideoIds(userIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({
        creator_user_id: userIds,
        status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus]
      })
      .order_by('video_id DESC')
      .fire();

    const response = {};

    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];
      response[userId] = { videoIds: [], videoDetails: {} };
    }

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = oThis.formatDbData(dbRows[index]);
      response[dbRow.creatorUserId].videoIds.push(dbRow.videoId);
      response[dbRow.creatorUserId].videoDetails[dbRow.videoId] = dbRow;
    }

    return response;
  }

  /**
   * Fetch by creator user id.
   *
   * @param {integer} params.limit: no of rows to fetch
   * @param {integer} params.creatorUserId: creator user id
   * @param {integer} params.paginationTimestamp: creator user id
   *
   * @returns {Promise}
   */
  async fetchByCreatorUserId(params) {
    const oThis = this;

    const limit = params.limit,
      creatorUserId = params.creatorUserId,
      paginationTimestamp = params.paginationTimestamp;

    const queryObject = oThis
      .select('*')
      .where({
        creator_user_id: creatorUserId,
        status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus]
      })
      .order_by('id desc')
      .limit(limit);

    if (paginationTimestamp) {
      queryObject.where(['created_at < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    const videoDetails = {};

    const videoIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      videoDetails[formatDbRow.videoId] = formatDbRow;
      videoIds.push(formatDbRow.videoId);
    }
    const videoToPopularChannelIdsMap = await new ChannelVideoModel().fetchPopularChannelIdsByVideoIds({
      videoIds: videoIds
    });
    for (const videoId in videoDetails) {
      const videoPopularChannelIds = videoToPopularChannelIdsMap[videoId];
      videoDetails[videoId].channelIds = videoPopularChannelIds || [];
    }

    return { videoIds: videoIds, videoDetails: videoDetails };
  }

  /**
   * Fetch video details by video ids.
   *
   * @param {array} videoIds
   *
   * @returns {Promise<void>}
   */
  async fetchByVideoIds(videoIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ video_id: videoIds })
      .fire();

    const response = {};

    const videoToPopularChannelIdsMap = await new ChannelVideoModel().fetchPopularChannelIdsByVideoIds({
      videoIds: videoIds
    });

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]),
        videoPopularChannelIds = videoToPopularChannelIdsMap[formatDbRow.videoId];

      response[formatDbRow.videoId] = formatDbRow;
      response[formatDbRow.videoId].channelIds = videoPopularChannelIds || [];
    }

    return response;
  }

  /**
   * Update by video id.
   *
   * @param {object} params
   * @param {number} params.totalAmount
   * @param {number} params.totalContributedBy
   * @param {number} params.videoId
   *
   * @returns {Promise<void>}
   */
  async updateByVideoId(params) {
    const oThis = this;

    const totalTransactions = 1;

    return oThis
      .update([
        'total_amount = total_amount + ?, total_transactions = total_transactions + ?, ' +
          'total_contributed_by = total_contributed_by + ? ',
        params.totalAmount,
        totalTransactions,
        params.totalContributedBy
      ])
      .where({ video_id: params.videoId })
      .fire();
  }

  /**
   * Insert new video.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.videoId
   * @param {string} [params.linkIds]
   * @param {string} params.status
   * @param {string/number} [params.perReplyAmountInWei]
   *
   * @returns {object}
   */
  insertVideo(params) {
    const oThis = this;

    const perReplyAmountInWei = params.perReplyAmountInWei || 0;
    let linkIds = null;

    if (params.linkIds && params.linkIds.length > 0) {
      linkIds = JSON.stringify(params.linkIds);
    }

    return oThis
      .insert({
        creator_user_id: params.userId,
        video_id: params.videoId,
        link_ids: linkIds,
        per_reply_amount_in_wei: perReplyAmountInWei,
        status: videoDetailsConstants.invertedStatuses[params.status]
      })
      .fire();
  }

  /**
   * Delete video details
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.videoIds
   *
   * @returns {object}
   */
  async markDeleted(params) {
    const oThis = this;

    await oThis
      .update({
        status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.deletedStatus]
      })
      .where({
        creator_user_id: params.userId,
        video_id: params.videoIds
      })
      .fire();

    return VideoDetail.flushCache(params);
  }

  /**
   * Delete by id.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @returns {Promise<void>}
   */
  async deleteById(params) {
    const oThis = this;

    await oThis
      .delete()
      .where({
        id: params.id
      })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} [params.userId]
   * @param {number} [params.videoId]
   * @param {number} [params.videoIds]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.userId) {
      const VideoDetailsByUserIdCache = require(rootPrefix +
        '/lib/cacheManagement/single/VideoDetailsByUserIdPagination');
      promisesArray.push(new VideoDetailsByUserIdCache({ userId: params.userId }).clear());
    }

    if (params.videoId) {
      const VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds');
      promisesArray.push(new VideoDetailsByVideoIds({ videoIds: [params.videoId] }).clear());
    }

    if (params.videoIds) {
      const VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds');
      promisesArray.push(new VideoDetailsByVideoIds({ videoIds: params.videoIds }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = VideoDetail;
