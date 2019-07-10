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

    oThis.tableName = 'video_detail';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      videoId: dbRow.video_id,
      totalTransactions: dbRow.total_transactions,
      totalAmount: dbRow.total_amount,
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
    return ['id', 'userId', 'videoId', 'totalTransactions', 'totalAmount', 'createdAt', 'updatedAt'];
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
   * Flush cache
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = VideoDetail;
