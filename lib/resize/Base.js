const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

// Declare variables.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Base class for media resizing.
 *
 * @class ResizeBase
 */
class ResizeBase {
  /**
   * Constructor for base class of media resizing.
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;

    oThis.originalResolution = {};
    oThis.currentResolutions = {};
  }

  /**
   * Main performer of class.
   *
   * @returns {Promise<* | never>}
   */
  perform() {
    const oThis = this;

    return oThis._asyncPerform().catch(async function(err) {
      let errorObject = err;

      if (!responseHelper.isCustomResult(err)) {
        errorObject = responseHelper.error({
          internal_error_identifier: 'l_r_b_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: err.toString() },
          error_config: errorConfig
        });
      }
      logger.error(' In catch block of lib/resize/Base', err);

      await oThis.markMediaResizeFailed().catch(function(error) {
        logger.error(`Failed to update media resize status as failed. Error: ${error}`);
      });

      return errorObject;
    });
  }

  /**
   * Get source URL.
   *
   * @param {string} resolutions
   *
   * @sets oThis.currentResolutions, oThis.originalResolution
   *
   * @returns {Promise<*>}
   */
  async getSourceUrl(resolutions) {
    const oThis = this;

    if (!resolutions) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_b_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { resolutions: resolutions }
        })
      );
    }
    oThis.currentResolutions = JSON.parse(resolutions);
    logger.log('oThis.currentResolutions', oThis.currentResolutions);
    oThis.currentResolutions.original.url = shortToLongUrl.getFullUrlInternal(oThis.currentResolutions.original.url);

    oThis.originalResolution = oThis.currentResolutions.original;
    logger.log('oThis.originalResolution', oThis.originalResolution);

    if (!oThis.originalResolution) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_b_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { resolutions: oThis.currentResolutions }
        })
      );
    }

    return oThis.originalResolution.url;
  }

  /**
   * Update media status as resize failed.
   *
   * @returns {Promise<*>}
   */
  async markMediaResizeFailed() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Get access control list.
   *
   * @returns {string}
   */
  getAcl() {
    return 'public-read';
  }

  /**
   * Get AWS region.
   *
   * @returns {string}
   */
  getRegion() {
    return 'us-east-1';
  }
}

module.exports = ResizeBase;
