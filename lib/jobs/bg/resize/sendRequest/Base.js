const rootPrefix = '../../../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
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
   * @param {number} [params.userId]
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
          debug_options: { error: err.toString(), stack: err.stack },
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
   * Async performer.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchEntity();

    await oThis._prepareResizerRequestData();

    return oThis._sendResizerRequest();
  }

  /**
   * Fetch entity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchEntity() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Prepare request data for resizer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareResizerRequestData() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Send request to resizer and mark in DB.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendResizerRequest() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Get source URL.
   *
   * @param {object} resolutions
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
    oThis.currentResolutions = resolutions;
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
   * Set resize details for all sizes.
   *
   * @param {string} sizeName
   * @param {object} sizeDetails
   * @param {string} contentType
   * @param {string} urlTemplate
   * @param {string} s3Folder
   *
   * @returns {{}}
   * @private
   */
  _setResizeDetails(sizeName, sizeDetails, contentType, urlTemplate, s3Folder) {
    const oThis = this;

    const resizeDetails = {};

    // If resize all flag is set, then following check is not performed.
    if (!oThis.resizeAll) {
      // Don't send to resize if already present in current resolution.
      if (oThis.currentResolutions[sizeName] && oThis.currentResolutions[sizeName].width) {
        return {};
      }
    }

    if (sizeDetails.width) {
      // Don't send to resize if asking width is greater than original width.
      if (oThis.originalResolution.width && oThis.originalResolution.width < sizeDetails.width) {
        return {};
      }
      resizeDetails.width = sizeDetails.width;
    }
    if (sizeDetails.height) {
      // Don't send to resize if asking height is grater than original height.
      if (oThis.originalResolution.height && oThis.originalResolution.height < sizeDetails.height) {
        return {};
      }
      resizeDetails.height = sizeDetails.height;
    }
    resizeDetails.content_type = contentType;

    const completeFileName = shortToLongUrl.getCompleteFileName(urlTemplate, sizeName);

    resizeDetails.file_path = s3Folder + '/' + completeFileName;
    resizeDetails.s3_url = shortToLongUrl.getFullUrlInternal(urlTemplate, sizeName);

    return resizeDetails;
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
    return s3Constants.publicReadAcl;
  }

  /**
   * Get AWS region.
   *
   * @returns {string}
   */
  getRegion() {
    return coreConstants.AWS_REGION;
  }
}

module.exports = ResizeBase;
