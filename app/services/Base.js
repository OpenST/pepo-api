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
 * @class ServicesBase
 */
class ServicesBase {
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

    return oThis._asyncPerform().catch(async function(err) {
      let errorObject = err;

      if (!responseHelper.isCustomResult(err)) {
        errorObject = responseHelper.error({
          internal_error_identifier: 'a_s_b_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: err.toString() },
          error_config: errorConfig
        });
      }
      logger.error(' In catch block of services/Base.js', err);

      return errorObject;
    });
  }

  /**
   * Parse pagination identifier.
   *
   * @param {string} paginationIdentifier
   *
   * @return {*}
   * @private
   */
  _parsePaginationParams(paginationIdentifier) {
    return basicHelper.decryptPageIdentifier(paginationIdentifier);
  }

  /**
   * Validate page size.
   *
   * @sets oThis.limit
   *
   * @return {Promise<never>}
   * @private
   */
  async _validatePageSize() {
    const oThis = this;

    const limitVas = CommonValidators.validateAndSanitizeLimit(
      oThis._currentPageLimit(),
      oThis._defaultPageLimit(),
      oThis._minPageLimit(),
      oThis._maxPageLimit()
    );

    if (!limitVas[0]) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_b_5',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_limit'],
          debug_options: {}
        })
      );
    }

    oThis.limit = limitVas[1];
  }

  _currentPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  _defaultPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  _minPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  _maxPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Async perform.
   *
   * @private
   * @returns {Promise<void>}
   */
  async _asyncPerform() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = ServicesBase;
