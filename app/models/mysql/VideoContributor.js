const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  videoContributorConstants = require(rootPrefix + '/lib/globalConstant/videoContributor'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

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
   * @param contributedByUserId {Integer} - User Id who cntributed for the video
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

  /***
   * Flush cache
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = VideoContributor;
