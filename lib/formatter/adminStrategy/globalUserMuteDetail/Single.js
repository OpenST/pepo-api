const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for global user mute detail formatter.
 *
 * @class GlobalUserMuteDetailFormatter
 */
class GlobalUserMuteDetailFormatter extends BaseFormatter {
  /**
   * Constructor for user formatter.
   *
   * @param {object} params
   * @param {object} params.globalUserMuteDetail
   *
   * @param {number} params.globalUserMuteDetail.all
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.globalUserMuteDetail = params.globalUserMuteDetail;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const globalUserMuteDetailKeyConfig = {
      all: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.globalUserMuteDetail, globalUserMuteDetailKeyConfig);
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
      all: Number(oThis.globalUserMuteDetail.all)
    });
  }
}

module.exports = GlobalUserMuteDetailFormatter;
