/**
 * This is base class for all services.
 *
 * @module app/services/Base
 */

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

// Declare error config.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Base class for all services.
 *
 * @class ServicesBaseKlass
 */
class ServicesBaseKlass {
  /**
   * Constructor for base class for all services.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.token = null;
    oThis.tokenId = null;
  }

  /**
   * Main performer method for the class.
   *
   * @returns {Promise<T>}
   */
  perform() {
    const oThis = this;

    return oThis._asyncPerform().catch(function(err) {
      if (responseHelper.isCustomResult(err)) {
        return err;
      }
      logger.error(' In catch block of services/Base.js', err);
      //TODO: error mail
      return responseHelper.error({
        internal_error_identifier: 'a_s_b_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: err.toString() },
        error_config: errorConfig
      });
    });
  }

  /**
   * Async perform.
   *
   * @private
   * @returns {Promise<void>}
   */
  async _asyncPerform() {
    throw new Error('sub-class to implement.');
  }
}

module.exports = ServicesBaseKlass;
