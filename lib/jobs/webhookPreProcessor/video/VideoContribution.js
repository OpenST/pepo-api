const rootPrefix = '../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoBase = require(rootPrefix + '/lib/jobs/webhookPreProcessor/video/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class for video contribution pre-processor.
 *
 * @class VideoContribution
 */
class VideoContribution extends VideoBase {
  /**
   * Constructor for video contribution pre-processor.
   *
   * @param {object} params
   * @param {number} params.videoId
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {object} params.transaction.extraData
   * @param {array<string/number>} params.transaction.toUserId
   *
   * @augments VideoBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.transaction = params.transaction;
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.feedObj
   *
   * @returns {Promise<void>}
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
   * Extra data for event kind.
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
   * Topic kind.
   *
   * @returns {string}
   * @private
   */
  _topicKind() {
    return webhookEventConstants.videoContributionTopicKind;
  }

  /**
   * Timestamp in seconds for webhook event.
   *
   * @returns {number}
   * @private
   */
  _executeAt() {
    return Math.floor(new Date() / 1000);
  }
}

module.exports = VideoContribution;
