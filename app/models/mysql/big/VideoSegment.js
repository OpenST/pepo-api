const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
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
      segmentUrl: shortToLongUrl.getFullUrlInternal(dbRow.segment_url, videoConstants.originalResolution),
      sequenceIndex: dbRow.sequence_index,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Insert multiple segments
   * @param {Number} jobId
   * @param {Array} videoUrls
   * @returns {Promise<void>}
   */
  async insertSegments(jobId, videoUrls) {
    const oThis = this;

    const bulkInsertArray = [];

    for (let ind = 0; ind < videoUrls.length; ind++) {
      const segmentUrl = await oThis._shortenS3Url(videoUrls[ind]);

      bulkInsertArray.push([jobId, segmentUrl, ind]);
    }

    await oThis.insertMultiple(['video_merge_job_id', 'segment_url', 'sequence_index'], bulkInsertArray).fire();
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

  /**
   * Shorten S3 url.
   *
   * @param {string} url
   *
   * @returns {Promise<string>}
   * @private
   */
  async _shortenS3Url(url) {
    const oThis = this;

    const splitUrlArray = url.split('/'),
      fileName = splitUrlArray.pop(),
      baseUrl = splitUrlArray.join('/'),
      shortEntity = s3Constants.LongUrlToShortUrlMap[baseUrl];

    if (CommonValidators.isVarNullOrUndefined(fileName) || CommonValidators.isVarNullOrUndefined(shortEntity)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_m_m_b_vs_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { url: url }
        })
      );
    }

    return shortEntity + '/' + fileName;
  }
}

module.exports = VideoSegment;
