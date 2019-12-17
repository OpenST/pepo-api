const rootPrefix = '../../../..',
  FirePixel = require(rootPrefix + '/lib/pixel/Fire'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  pixelParamsValidator = require(rootPrefix + '/lib/jobs/pixel/validate'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for pixel job handler base.
 *
 * @class Base
 */
class Base {
  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    // Get specific variables for given entity pixel.
    const specificVars = await oThis.getSpecificVars();

    const pixelIdentifier = oThis.pixelIdentifierKey;

    // Validate parameters for given entity type.
    const validationResponse = pixelParamsValidator.validateForPixelIdentifier(pixelIdentifier, specificVars);
    if (validationResponse.isFailure()) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_j_p_h_b_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { pixelIdentifier: pixelIdentifier, specificVars: specificVars }
      });

      return createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }

    // Merge entity type variables with default variables.
    let pixelVars = Object.assign({}, oThis._defaultVars, specificVars);

    pixelVars = oThis._convertParamsToShortName(pixelVars);

    // Fire pixel.
    await new FirePixel({ pixelVars: pixelVars }).perform();
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
   * Get entity type.
   *
   * @returns {string}
   */
  get entityType() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Get entity action.
   *
   * @returns {string}
   */
  get entityAction() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Get pixel identifier key.
   *
   * @returns {string}
   */
  get pixelIdentifierKey() {
    const oThis = this;

    return pixelConstants.getPixelIdentifierKey(oThis.entityType, oThis.entityAction);
  }
}

module.exports = Base;
