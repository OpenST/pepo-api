const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  videoDetailConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class VideoDetail extends ModelBase {
  /**
   * video detail By model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_details';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      creatorUserId: dbRow.creator_user_id,
      videoId: dbRow.video_id,
      totalContributedBy: dbRow.total_contributed_by,
      totalAmount: dbRow.total_amount,
      totalTransactions: dbRow.total_transactions,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * List Of Formatted Column names that can be exposed by service
   *
   *
   * @returns {Array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'creatorUserId',
      'videoId',
      'totalContributedBy',
      'totalTransactions',
      'totalAmount',
      'createdAt',
      'updatedAt'
    ];
  }

  /***
   * Fetch videoDetail object for video id
   *
   * @param videoId {Integer} - video id
   *
   * @return {Object}
   */
  async fetchByVideoId(videoId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ video_id: videoId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Fetch users contributed by object
   * contributedByUserId paid to user ids
   *
   * @param videoIds {Array} - Array of video id
   * @param userId {Integer} - id of user who clicked the video
   *
   * @return {Object}
   */
  async fetchByVideoIdsAndUserId(videoIds, userId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ video_id: videoIds, creator_user_id: userId })
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch video details by video ids.
   *
   * @param {Array} videoIds
   * @returns {Promise<void>}
   */
  async fetchByVideoIds(videoIds) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ video_id: videoIds })
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId] = formatDbRow;
    }

    return response;
  }
  /**
   * Update by user id.
   *
   * @returns {Promise<void>}
   */
  async updateByVideoId(videoId, totalAmount, totalContributedBy = 1, totalTransactions = 1) {
    const oThis = this;

    return oThis
      .update([
        'total_amount = total_amount + ?, total_transactions = total_transactions + ?, ' +
          'total_contributed_by = total_contributed_by + ? ',
        totalAmount,
        totalTransactions,
        totalContributedBy
      ])
      .where({ video_id: videoId })
      .fire();
  }

  /**
   * Insert into video details.
   *
   * @returns {Promise<void>}
   */
  async insertIntoVideoDetails(creatorUserId, videoId, totalAmount, totalTransactions = 1) {
    const oThis = this;

    return oThis
      .insert({
        creator_user_id: creatorUserId,
        video_id: videoId,
        total_contributed_by: 1,
        total_amount: totalAmount,
        total_transactions: totalTransactions
      })
      .fire();
  }

  /**
   * Insert new video
   *
   * @param params {object} - params
   *
   * @return {object}
   */
  insertVideo(params) {
    const oThis = this;

    return oThis
      .insert({
        creator_user_id: params.userId,
        video_id: params.videoId
      })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.videoId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const VideoDetailsByVideoIdsAndUserId = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds');

    await new VideoDetailsByVideoIdsAndUserId({
      userId: params.userId,
      videoIds: [params.videoId]
    }).clear();

    const VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds');

    await new VideoDetailsByVideoIds({
      videoIds: [params.videoId]
    }).clear();
  }
}

module.exports = VideoDetail;
