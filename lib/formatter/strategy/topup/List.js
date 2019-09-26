const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserTopUpsSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/topup/Single'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class TopupListFormatter extends BaseFormatter {
  /**
   * Constructor for userTopUps list formatter.
   *
   * @param {object} params
   * @param {array} params.userTopUpsList
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis[entityType.topupList] = params[entityType.topupList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis[entityType.topupList])) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_utu_l_1',
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

    const finalResponse = [];

    for (let index = 0; index < oThis[entityType.topupList].length; index++) {
      const resp = new UserTopUpsSingleFormatter({
        [entityType.topup]: oThis[entityType.topupList][index]
      }).perform();

      if (resp.isFailure()) {
        return resp;
      }

      finalResponse.push(resp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = TopupListFormatter;
