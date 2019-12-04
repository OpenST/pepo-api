const uuidV4 = require('uuid/v4');

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
 * @class PixelFire
 */
class PixelFire {
  /**
   * Main performer for class.
   *
   * @param {object} params
   *
   * @returns {Promise}
   */
  async perform(params) {
    const oThis = this;

    const entityType = params.e_entity;

    const specificVars = await oThis._getSpecificVars(entityType, params);

    let pixelVars = Object.assign({}, oThis._defaultVars, specificVars);

    const validationResponse = pixelParamsValidator.validateForEntityType(entityType, pixelVars);

    if (validationResponse.isFailure()) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_j_p_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { entityType: entityType, pixelVars: pixelVars }
      });

      logger.error(errorObject);

      return createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);
    }

    pixelVars = oThis._convertParamsToShortName(pixelVars);

    await oThis._firePixel(pixelVars);
  }

  /**
   * Get pixel specific vars if required.
   *
   * @param {string} entityType
   * @param {object} messagePayload
   *
   * @returns {Promise}
   * @private
   */
  async _getSpecificVars(entityType, messagePayload) {
    switch (entityType) {
      case pixelConstants.registerUserEntityType: {
        return messagePayload;
      }
      case pixelConstants.accountUpdateEntityType: {
        return messagePayload;
      }
      default: {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'l_j_p_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { entityType: entityType, messagePayload: messagePayload }
        });

        logger.error(errorObject);

        return createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);
      }
    }
  }

  /**
   * Fefault values of variables.
   *
   * @returns {{}}
   * @private
   */
  get _defaultVars() {
    return {
      t_version: 2,
      t_gid: uuidV4(),
      u_service_id: 1,
      u_session_id: 'placeholder_u_session_id',
      u_timezone: '',
      device_id: 't_device_id',
      device_model: 't_',
      device_platform: 't_',
      device_os: 't_',
      device_language: 't_',
      device_width: 1,
      device_height: 1,
      device_type: 'mobile_app_backend',
      user_agent: pixelConstants.pixelUserAgent,
      mobile_app_version: '123'
    };
  }

  /**
   * Convert known names to short form, leave other keys as it is.
   *
   * @param pixelVars
   * @private
   */
  _convertParamsToShortName(pixelVars) {
    const newPixelVars = {};
    for (const key in pixelVars) {
      let newKey = pixelConstants.longToshortKeysMap[key];
      newKey = newKey || key;

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

    const resp = await httpLibObj.get(pixelVars).catch(function(err) {
      logger.error(err);

      return createErrorLogsEntry.perform(err, errorLogsConstants.lowSeverity);
    });

    logger.log('-----------------resp---', resp);
  }
}

module.exports = new PixelFire();
