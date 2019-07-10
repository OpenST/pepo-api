const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  videoContributedByConstants = require(rootPrefix + '/lib/globalConstant/videoContributedBy'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class VideoContributedBy extends ModelBase {
  /**
   * Video Contributed By model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_contributed_by';
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
    return ['id', 'videoId', 'contributedByUserId', 'totalTransactions', 'totalAmount', 'createdAt', 'updatedAt'];
  }

  /***
   * Fetch videoDetail object for video id
   *
   * @param videoId {Integer} - video id
   * @param contributedByUserId {Integer} - User Id who cntributed for the video
   *
   * @return {Object}
   */
  async fetchByVideoIdAndContributedByUserId(videoId, contributedByUserId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ video_id: videoId, contributed_by_user_id: contributedByUserId })
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

module.exports = VideoContributedBy;
