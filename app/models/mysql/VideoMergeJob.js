const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/videoMergeJob');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for video merge job model.
 *
 * @class VideoMergeJob
 */
class VideoMergeJob extends ModelBase {
  /**
   * Constructor for video merge job model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_merge_jobs';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.merged_url
   * @param {number} dbRow.status
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      mergedUrl: dbRow.merged_url,
      status: videoMergeJobConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch video merge jobs by ids.
   *
   * @param {number} jobIds
   *
   * @returns {Promise<{}>}
   */
  async fetchVideoMergeJobByIds(jobIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ id: jobIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert video merge job
   * @param params
   * @returns {Promise<void>}
   */
  async insertJob(params) {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    return oThis
      .insert({
        user_id: params.userId,
        merged_url: params.mergedUrl,
        status: videoMergeJobConstants.invertedStatuses[videoMergeJobConstants.notStartedStatus],
        created_at: currentTime,
        updated_at: currentTime
      })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} [params.ids]
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.ids) {
      const VideoMergeJobByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoMergeJobByIds');
      promisesArray.push(new VideoMergeJobByIdsCache({ ids: params.ids }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = VideoMergeJob;
