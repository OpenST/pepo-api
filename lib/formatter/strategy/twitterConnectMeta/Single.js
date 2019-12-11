const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for twitter connect meta formatter.
 *
 * @class TwitterConnectMetaFormatter
 */
class TwitterConnectMetaFormatter extends BaseFormatter {
  /**
   * Constructor for twitter connect meta formatter.
   *
   * @param {object} params
   * @param {object} [params.meta]
   * @param {number} [params.isRegistration]
   * @param {string} [params.inviteCode]
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.meta = params.meta || {};
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      is_registration: oThis.meta.isRegistration || 0,
      invite_code: oThis.meta.inviteCode || ''
    });
  }
}

module.exports = TwitterConnectMetaFormatter;
