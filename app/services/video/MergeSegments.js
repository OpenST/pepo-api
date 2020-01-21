const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoSegmentModel = require(rootPrefix + '/app/models/mysql/big/VideoSegment'),
  VideoMergeJobModel = require(rootPrefix + '/app/models/mysql/big/VideoMergeJob'),
  util = require(rootPrefix + '/lib/util'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/videoMergeJob');

/**
 * Class to merge video segments.
 *
 * @class MergeSegments
 */
class MergeSegments extends ServiceBase {
  /**
   * Constructor to merge video segments.
   *
   * @param {object} params
   * @param {string} params.video_urls
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.stringifiedVideoUrls = params.video_urls;
    oThis.currentUserId = params.current_user.id;

    oThis.videoUrls = [];
    oThis.mergedVideoS3Url = '';
    oThis.jobId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._insertInVideoMergeJob();

    await oThis._insertInVideoSegments();

    await oThis._enqueueMergeJob();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.videoUrls
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    try {
      oThis.videoUrls = JSON.parse(oThis.stringifiedVideoUrls);
    } catch (err) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_ms_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            stringifiedVideoUrls: oThis.stringifiedVideoUrls
          }
        })
      );
    }

    for (let ind = 0; ind < oThis.videoUrls.length; ind++) {
      const url = oThis.videoUrls[ind].video_url,
        splitUrlArray = url.split('/'),
        fileName = splitUrlArray.pop();

      if (!CommonValidators.validateNonEmptyUrl(url) || !fileName.match(oThis.currentUserId + '-')) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_v_ms_2',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_url'],
            debug_options: {
              url: url
            }
          })
        );
      }

      oThis.videoUrls[ind] = url;
    }
  }

  /**
   * Insert in video merge job.
   *
   * @sets oThis.mergedVideoS3Url, oThis.jobId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInVideoMergeJob() {
    const oThis = this;

    oThis.mergedVideoS3Url =
      s3Constants.videoShortUrlPrefix +
      '/' +
      util.getS3FileTemplatePrefix(oThis.currentUserId) +
      s3Constants.fileNameShortSizeSuffix +
      '.mp4';

    const response = await new VideoMergeJobModel().insertJob({
      userId: oThis.currentUserId,
      mergedUrl: oThis.mergedVideoS3Url
    });

    oThis.jobId = response.insertId;
  }

  /**
   * Insert in video segments.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInVideoSegments() {
    const oThis = this;

    return new VideoSegmentModel().insertSegments(oThis.jobId, oThis.videoUrls);
  }

  /**
   * Enqueue merge background job.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueMergeJob() {
    const oThis = this;

    const payload = {
      jobId: oThis.jobId
    };

    await bgJob.enqueue(bgJobConstants.videoMergeJobTopic, payload);
  }

  /**
   * Prepare final response.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    const response = {
      id: oThis.jobId,
      status: videoMergeJobConstants.notStartedStatus,
      mergedUrl: shortToLongUrl.getFullUrlInternal(oThis.mergedVideoS3Url, videoConstants.originalResolution),
      updatedAt: currentTime
    };

    return responseHelper.successWithData({ [entityTypeConstants.videoMergeJob]: response });
  }
}

module.exports = MergeSegments;
