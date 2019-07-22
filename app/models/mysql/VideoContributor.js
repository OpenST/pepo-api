const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.userDbName;

class VideoContributor extends ModelBase {
  /**
   * Video Contributor model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_contributors';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      videoId: dbRow.video_id,
      contributedByUserId: dbRow.contributed_by_user_id,
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
    return ['id', 'videoId', 'contributedByUserId', 'totalTransactions', 'totalAmount', 'createdAt', 'updatedAt'];
  }

  /***
   * Fetch videoDetail object for video id
   *
   * @param {array} videoIds  - video id
   * @param {Integer} contributedByUserId  - User Id who contributed for the video
   *
   * @return {Object}
   */
  async fetchByVideoIdAndContributedByUserId(videoIds, contributedByUserId) {
    const oThis = this;

    let dbRows = await oThis
      .select('*')
      .where({ video_id: videoIds, contributed_by_user_id: contributedByUserId })
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId] = formatDbRow;
    }

    return response;
  }

  /**
   * Update by video id and contributed by user id.
   *
   * @param {number} params.videoId  - video id
   * @param {number} params.contributedByUserId  - User Id who contributed for the video
   * @param {number} params.totalAmount  - Total amount
   *
   * @returns {Promise<*>}
   */
  async updateByVideoIdAndContributedByUserId(params) {
    const oThis = this;

    let totalTransactions = 1;

    return oThis
      .update([
        'total_amount = total_amount + ? ,total_transactions = total_transactions + ? ',
        params.totalAmount,
        totalTransactions
      ])
      .where({ video_id: params.videoId, contributed_by_user_id: params.contributedByUserId })
      .fire();
  }

  /**
   * Update by video id and contributed by user id.
   *
   * @param {number} params.videoId  - video id
   * @param {number} params.contributedByUserId  - User Id who contributed for the video
   * @param {number} params.totalAmount  - Total amount
   *
   * @returns {Promise<*>}
   */
  async insertVideoContributor(params) {
    const oThis = this,
      totalTransactions = 1;

    return oThis
      .insert({
        video_id: params.videoId,
        contributed_by_user_id: params.contributedByUserId,
        total_amount: params.totalAmount,
        total_transactions: totalTransactions
      })
      .fire();
  }

  /***
   * Flush cache
   *
   * @param {object} params
   * @param {number} params.contributedByUserId
   * @param {array} params.videoIds
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const VideoContributorByVideoIdsAndContributedByUserId = require(rootPrefix +
      '/lib/cacheManagement/multi/VideoContributorByVideoIdsAndContributedByUserId');

    await new VideoContributorByVideoIdsAndContributedByUserId({
      contributedByUserId: params.contributedByUserId,
      videoIds: [params.videoId]
    }).clear();
  }
}

module.exports = VideoContributor;
