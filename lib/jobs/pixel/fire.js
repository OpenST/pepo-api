const rootPrefix = '../../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  pixelParamsValidator = require(rootPrefix + '/lib/jobs/pixel/validate'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class to fire pixel.
 *
 * @class FirePixel
 */
class FirePixel {
  /**
   * Main performer for class.
   *
   * @param {object} params
   * @param {string} params.entity_type
   * @param {string} params.pixel_identifier
   *
   * @returns {Promise<*>}
   */
  async perform(params) {
    const oThis = this;

    const pixelIdentifier = params.pixel_identifier;

    // Get specific variables for given pixel identifier.
    const specificVars = await oThis._getSpecificVars(pixelIdentifier, params);

    // Validate parameters for given entity type.
    const validationResponse = pixelParamsValidator.validateForPixelIdentifier(pixelIdentifier, specificVars);
    if (validationResponse.isFailure()) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_j_p_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { pixelIdentifier: pixelIdentifier, specificVars: specificVars }
      });

      return createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);
    }

    // Merge entity type variables with default variables.
    let pixelVars = Object.assign({}, oThis._defaultVars, specificVars);

    pixelVars = oThis._convertParamsToShortName(pixelVars);

    await oThis._firePixel(pixelVars);
  }

  /**
   * Get pixel specific vars if required.
   *
   * @param {string} pixelIdentifier
   * @param {object} messagePayload
   *
   * @returns {Promise}
   * @private
   */
  async _getSpecificVars(pixelIdentifier, messagePayload) {
    switch (pixelIdentifier) {
      case pixelConstants.getPixelIdentifierKey(messagePayload.entity_type, messagePayload.entity_action): {
        return {
          entity_type: messagePayload.entity_type,
          entity_action: messagePayload.entity_action,
          page_type: messagePayload.page_type,
          page_name: messagePayload.page_name,
          approved_user_id: messagePayload.approved_user_id,
          user_id: messagePayload.current_admin_id // UserId is admin id for this pixel.
        };
      }
      default: {
        throw new Error('Unknown entity type.');
      }
    }
  }

  /**
   * Default values of variables.
   *
   * @returns {{}}
   * @private
   */
  get _defaultVars() {
    return {
      t_version: 2,
      t_gid: 'pepo_admin_backend',
      u_session_id: 'admin_backend',
      u_service_id: 1,
      u_timezone: pixelConstants.timezoneOffset,
      device_id: 'pepo_admin_backend',
      device_language: 'en-US',
      device_type: 'pepo_admin_backend',
      user_agent: pixelConstants.pixelUserAgent
    };
  }

  /**
   * Convert known names to short form if available. Leave other keys as it is.
   *
   * @param {object} pixelVars
   *
   * @returns {{}}
   * @private
   */
  _convertParamsToShortName(pixelVars) {
    const newPixelVars = {};

    for (const key in pixelVars) {
      const newKey = pixelConstants.longToShortNameKeysMap[key] || key;

      newPixelVars[newKey] = pixelVars[key];
    }

    return newPixelVars;
  }

  /**
   * Fire http call to tracker.
   *
   * @param {object} pixelVars
   *
   * @returns {Promise<void>}
   * @private
   */
  async _firePixel(pixelVars) {
    const header = { 'User-Agent': pixelConstants.pixelUserAgent };

    const httpLibObj = new HttpLibrary({
      resource: coreConstants.PA_TRACKER_ENDPOINT,
      header: header
    });

    await httpLibObj.get(pixelVars).catch(function(err) {
      logger.error(err);

      return createErrorLogsEntry.perform(err, errorLogsConstants.lowSeverity);
    });
  }
}

module.exports = new FirePixel();
