const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AdminGlobalUserMuteDetailSingleFormatter = require(rootPrefix +
    '/lib/formatter/adminStrategy/globalUserMuteDetail/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for global user mute map formatter.
 *
 * @class GlobalUserMuteDetailMapFormatter
 */
class GlobalUserMuteDetailMapFormatter extends BaseFormatter {
  /**
   * Constructor for global user mute map formatter.
   *
   * @param {object} params
   * @param {object} params.globalUserMuteDetailsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.globalUserMuteDetailsMap = params.globalUserMuteDetailsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.globalUserMuteDetailsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_mu_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          object: oThis.globalUserMuteDetailsMap
        }
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

    for (const userId in oThis.globalUserMuteDetailsMap) {
      const globalUserMuteDetailObj = oThis.globalUserMuteDetailsMap[userId];

      const formattedResp = new AdminGlobalUserMuteDetailSingleFormatter({
        globalUserMuteDetail: globalUserMuteDetailObj
      }).perform();

      if (formattedResp.isFailure()) {
        return formattedResp;
      }

      finalResponse[userId] = formattedResp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GlobalUserMuteDetailMapFormatter;
