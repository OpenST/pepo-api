const uuidV4 = require('uuid/v4');

const rootPrefix = '../../../..',
  VideoBase = require(rootPrefix + '/lib/jobs/webhookPreProcessor/video/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Constructor for VideoContribution.
 *
 * @class VideoContribution
 */
class VideoContribution extends VideoBase {
  /**
   * Constructor for VideoContribution.
   *
   * @augments VideoContribution
   * @param {object} params
   * @param {number} params.videoId
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {object} params.transaction.extraData
   * @param {array<string/number>} params.transaction.toUserId
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;
    logger.log('VideoContribution===========', params);

    oThis.transaction = params.transaction;

    oThis.tagIds = [];
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.feedObj
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    await super._validateAndSanitizeParams();

    let hasError = false;

    if (!CommonValidators.validateNonEmptyObject(oThis.transaction)) {
      hasError = true;
    }

    if (!hasError && oThis.transaction.status !== transactionConstants.doneStatus) {
      hasError = true;
    }

    if (!hasError && (!oThis.transaction.id || !oThis.transaction.fromUserId || !oThis.transaction.toUserId)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_wpp_v_vc_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction }
        })
      );
    }
  }

  /**
   * Extra Data for event kind
   *
   * @returns {Object}
   * @private
   */
  _extraDataForWebhookEvent() {
    const oThis = this;

    return {
      transactionId: oThis.transaction.id,
      videoId: oThis.videoId
    };
  }

  /**
   * Topic Kind
   *
   * @returns {string}
   * @private
   */
  _topicKind() {
    const oThis = this;

    return webhookEventConstants.videoContributionTopicKind;
  }

  /**
   * Timestamp in Seconds for webhook event
   *
   * @returns {string}
   * @private
   */
  _executeAt() {
    const oThis = this;

    return Math.round(new Date() / 1000);
  }
}

module.exports = VideoContribution;
