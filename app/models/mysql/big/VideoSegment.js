const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.bigDbName;

// TODO - santhosh - add method for insert
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
      segmentUrl: shortToLongUrl.getFullUrlInternal(dbRow.segment_url, videoConstants.originalResolution),
      sequenceIndex: dbRow.sequence_index,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
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
