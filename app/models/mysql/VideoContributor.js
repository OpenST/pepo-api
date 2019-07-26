const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for video contributor model.
 *
 * @class VideoContributor
 */
class VideoContributor extends ModelBase {
  /**
   * Constructor for video contributor model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_contributors';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.video_id
   * @param {number} dbRow.contributed_by_user_id
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
      videoId: dbRow.video_id,
      contributedByUserId: dbRow.contributed_by_user_id,
      totalAmount: dbRow.total_amount,
      totalTransactions: dbRow.total_transactions,
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
    return ['id', 'videoId', 'contributedByUserId', 'totalTransactions', 'totalAmount', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch videoDetail object for video id.
   *
   * @param {array} videoIds: video id
   * @param {integer} contributedByUserId: User Id who contributed for the video
   *
   * @return {object}
   */
  async fetchByVideoIdAndContributedByUserId(videoIds, contributedByUserId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ video_id: videoIds, contributed_by_user_id: contributedByUserId })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId] = formatDbRow;
    }

    return response;
  }

  /**
   * Update by video id and contributed by user id.
   *
   * @param {number} params.videoId: video id
   * @param {number} params.contributedByUserId: User Id who contributed for the video
   * @param {number} params.totalAmount: Total amount
   *
   * @returns {Promise<*>}
   */
  async updateByVideoIdAndContributedByUserId(params) {
    const oThis = this;

    const totalTransactions = 1;

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
   * @param {number} params.videoId: video id
   * @param {number} params.contributedByUserId: User Id who contributed for the video
   * @param {number} params.totalAmount: Total amount
   *
   * @returns {Promise<*>}
   */
  async insertVideoContributor(params) {
    const oThis = this;

    const totalTransactions = 1;

    return oThis
      .insert({
        video_id: params.videoId,
        contributed_by_user_id: params.contributedByUserId,
        total_amount: params.totalAmount,
        total_transactions: totalTransactions
      })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.contributedByUserId
   * @param {array} params.videoId
   *
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

  /**
   * Index name.
   *
   * @returns {string}
   */
  static get videoIdContributedByUniqueIndexName() {
    return 'uidx_1';
  }
}

module.exports = VideoContributor;
