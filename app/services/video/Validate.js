const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to validate video by user.
 *
 * @class ValidateUploadVideoParams
 */
class ValidateUploadVideoParams extends ServiceBase {
  /**
   * Constructor to validate video by user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} [params.video_description]: Video description
   * @param {string} [params.link]: Link
   * @param {string/number} [params.per_reply_amount_in_wei]: amount in wei to write reply on video.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.videoDescription = params.video_description;
    oThis.perReplyAmountInWei = params.per_reply_amount_in_wei;
    oThis.link = params.link;
  }

  /**
   * Async perform.
   *
   * @return {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validate();
    return responseHelper.successWithData({});
  }

  /**
   * Validate.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validate() {
    const oThis = this;

    const perReplyAmount = basicHelper.convertWeiToNormal(oThis.perReplyAmountInWei);

    if (!CommonValidators.validateInteger(perReplyAmount.toString(10))) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_v_v_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_per_reply_amount_in_wei'],
          debug_options: { perReplyAmountInWei: oThis.perReplyAmountInWei }
        })
      );
    }
  }
}

module.exports = ValidateUploadVideoParams;
