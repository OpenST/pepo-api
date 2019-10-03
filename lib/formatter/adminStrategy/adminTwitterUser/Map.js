const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  adminTwitterUserSingleFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/adminTwitterUser/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for twitter user map formatter.
 *
 * @class AdminTwitterUserMapFormatter
 */
class AdminTwitterUserMapFormatter extends BaseFormatter {
  /**
   * Constructor for twitter user map formatter.
   *
   * @param {object} params
   * @param {object} params.adminTwitterUsersMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.adminTwitterUsersMap = params.adminTwitterUsersMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.adminTwitterUsersMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_tu_m_1',
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

    for (const userId in oThis.adminTwitterUsersMap) {
      const adminTwitterUserObj = oThis.adminTwitterUsersMap[userId],
        formattedAdminTwitterUsersRsp = new adminTwitterUserSingleFormatter({
          adminTwitterUser: adminTwitterUserObj
        }).perform();

      if (formattedAdminTwitterUsersRsp.isFailure()) {
        return formattedAdminTwitterUsersRsp;
      }

      finalResponse[userId] = formattedAdminTwitterUsersRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = AdminTwitterUserMapFormatter;
