const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  videoDetailsConst = require(rootPrefix + '/lib/globalConstant/videoDetail');

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
   * @param {array} dbRow.link_ids
   * @param {number} dbRow.total_contributed_by
   * @param {number} dbRow.total_amount
   * @param {number} dbRow.total_transactions
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      creatorUserId: dbRow.creator_user_id,
      videoId: dbRow.video_id,
      descriptionId: dbRow.description_id,
      linkIds: dbRow.link_ids,
      totalContributedBy: dbRow.total_contributed_by,
      totalAmount: dbRow.total_amount,
      totalTransactions: dbRow.total_transactions,
      status: videoDetailsConst.statuses[dbRow.status],
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
      'status',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Fetch videoDetail object for video id.
   *
   * @param {integer} videoId: video id
   *
   * @return {object}
   */
  async fetchLatestVideoId(userIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('creator_user_id, max(id) as latest_video_id')
      .where({
        creator_user_id: userIds,
        status: videoDetailsConst.invertedStatuses[videoDetailsConst.activeStatus]
      })
      .group_by(['creator_user_id'])
      .fire();

    let response = {};

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
   * Fetch videoDetail object for video id.
   *
   * @param {integer} videoId: video id
   *
   * @return {object}
   */
  async fetchByVideoId(videoId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ video_id: videoId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch by creator user id
   *
   * @param {integer} params.limit: no of rows to fetch
   * @param {integer} params.creatorUserId: creator user id
   * @param {integer} params.paginationTimestamp: creator user id
   * @return {Promise}
   */
  async fetchByCreatorUserId(params) {
    const oThis = this,
      limit = params.limit,
      creatorUserId = params.creatorUserId,
      paginationTimestamp = params.paginationTimestamp;

    const queryObject = oThis
      .select('*')
      .where({
        creator_user_id: creatorUserId,
        status: videoDetailsConst.invertedStatuses[videoDetailsConst.activeStatus]
      })
      .order_by('id desc')
      .limit(limit);

    if (paginationTimestamp) {
      queryObject.where(['created_at < ?', paginationTimestamp]);
    }

    let dbRows = await queryObject.fire();

    let videoDetails = {};

    let videoIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      videoDetails[formatDbRow.videoId] = formatDbRow;
      videoIds.push(formatDbRow.videoId);
    }

    return { videoIds: videoIds, videoDetails: videoDetails };
  }

  /**
   * Fetch users contributed by object
   * contributedByUserId paid to user ids
   *
   * @param {array} videoIds: Array of video id
   * @param {integer} userId: id of user who clicked the video
   *
   * @return {object}
   */
  async fetchByVideoIdsAndUserId(videoIds, userId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ video_id: videoIds, creator_user_id: userId })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId] = formatDbRow;
    }

    return response;
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

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId] = formatDbRow;
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
   * @param {string} params.linkIds
   * @param {string} params.status
   *
   * @return {object}
   */
  insertVideo(params) {
    const oThis = this;

    let linkIds = null;

    if (params.linkIds && params.linkIds.length > 0) {
      linkIds = JSON.stringify(params.linkIds);
    }

    return oThis
      .insert({
        creator_user_id: params.userId,
        video_id: params.videoId,
        link_ids: linkIds,
        status: videoDetailsConst.invertedStatuses[params.status]
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
   * @return {object}
   */
  async markDeleted(params) {
    const oThis = this;

    await oThis
      .update({
        status: videoDetailsConst.invertedStatuses[videoDetailsConst.deletedStatus]
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
   * @return {Promise<void>}
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
