const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for slack related webhooks events base.
 *
 * @class SlackEventBase
 */
class SlackEventBase extends ServiceBase {
  /**
   * Constructor for slack related webhooks events base.
   *
   * @param {object} params
   * @param {object} params.eventParams: event params
   * @param {object} params.currentAdmin: current admin params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.eventParams = params.eventParams;
    oThis.currentAdmin = params.currentAdmin;
  }

  /**
   * Validate param
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for salck events factory');

    if (!oThis.eventParams || !CommonValidators.validateNonEmptyObject(oThis.eventParams)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_se_b_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = SlackEventBase;
