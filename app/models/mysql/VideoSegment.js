const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for video segment model.
 *
 * @class VideoSegment
 */
class VideoSegment extends ModelBase {
  /**
   * Constructor for video segment model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_segments';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.video_merge_job_id
   * @param {string} dbRow.segment_url
   * @param {number} dbRow.sequence_index
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      videoMergeJobId: dbRow.video_merge_job_id,
      segmentUrl: dbRow.segment_url,
      sequenceIndex: dbRow.sequence_index,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Insert segment
   *
   * @param params
   * @returns {Promise<void>}
   */
  async insertSegment(params) {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    return oThis
      .insert({
        video_merge_job_id: params.jobId,
        segment_url: params.segmentUrl,
        created_at: currentTime,
        updated_at: currentTime
      })
      .fire();
  }

  /**
   * Fetch video segments by job id.
   *
   * @param {number} jobId
   *
   * @returns {Promise}
   */
  async fetchSegmentsByJobId(jobId) {
    const oThis = this;

    const dbRows = await oThis
      .select('segment_url, sequence_index')
      .where({
        video_merge_job_id: jobId
      })
      .order_by('sequence_index asc')
      .fire();

    const response = [];

    for (let ind = 0; ind < dbRows.length; ind++) {
      const formattedRow = oThis.formatDbData(dbRows[ind]);
      response.push(formattedRow);
    }

    return response;
  }
}

module.exports = VideoSegment;
