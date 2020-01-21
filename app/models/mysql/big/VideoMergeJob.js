const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
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
      mergedUrl: shortToLongUrl.getFullUrlInternal(dbRow.merged_url, videoConstants.originalResolution),
      status: videoMergeJobConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Update job status
   * @param status
   * @param jobId
   * @returns {Promise<void>}
   */
  async updateStatus(status, jobId) {
    const oThis = this;

    await oThis
      .update(['status = ?', videoMergeJobConstants.invertedStatuses[status]])
      .where(['id = ?', jobId])
      .fire();

    await VideoMergeJob.flushCache({ ids: [jobId] });
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
   * Insert video merge job.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {string} params.mergedUrl
   *
   * @returns {Promise<void>}
   */
  async insertJob(params) {
    const oThis = this;

    const resp = await oThis
      .insert({
        user_id: params.userId,
        merged_url: params.mergedUrl,
        status: videoMergeJobConstants.invertedStatuses[videoMergeJobConstants.notStartedStatus]
      })
      .fire();

    await VideoMergeJob.flushCache({ ids: [resp.insertId] });

    return resp;
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
