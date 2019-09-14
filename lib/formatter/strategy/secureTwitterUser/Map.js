const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  SecureTwitterUserSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/secureTwitterUser/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for twitter user map formatter.
 *
 * @class twitterUserMapFormatter
 */
class twitterUserMapFormatter extends BaseFormatter {
  /**
   * Constructor for twitter user map formatter.
   *
   * @param {object} params
   * @param {object} params.twitterUsersMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.twitterUsersMap = params.twitterUsersMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.twitterUsersMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_stu_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = {};

    for (const userId in oThis.twitterUsersMap) {
      const twitterUserObj = oThis.twitterUsersMap[userId],
        formattedTwitterUsersRsp = new SecureTwitterUserSingleFormatter({ twitterUser: twitterUserObj }).perform();

      if (formattedTwitterUsersRsp.isFailure()) {
        return formattedTwitterUsersRsp;
      }

      finalResponse[userId] = formattedTwitterUsersRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = twitterUserMapFormatter;
