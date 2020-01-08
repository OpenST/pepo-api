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
   * @param {number} dbRow.sequence_number
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
      sequenceNumber: dbRow.sequence_number,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }
}

module.exports = VideoSegment;
