/**
 * Module for creating entry in infra.error_logs table.
 *
 * @module lib/errorLogs/createEntry
 */

const rootPrefix = '../..',
  ErrorLogs = require(rootPrefix + '/app/models/mysql/ErrorLogs'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to create entry in error_logs table.
 *
 * @class CreateEntry
 */
class CreateEntry {
  /**
   * Performer method for class.
   *
   * @param {Object} errorObject
   * @param {String} [severity]: defaults to high.
   *
   * @return {Promise<void>}
   */
  perform(errorObject, severity, appName) {
    const oThis = this;

    return oThis._asyncPerform(errorObject, severity, appName).catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      }
      logger.error(`${__filename}::perform::catch`);
      logger.error(error);

      return responseHelper.error({
        internal_error_identifier: 'l_el_ce_1',
        api_error_identifier: 'unhandled_catch_response',
        debug_options: {}
      });
    });
  }

  /**
   * Async performer.
   *
   * @param {Object} errorObject
   * @param {String} severity
   *
   * @return {Promise<void>}
   */
  async _asyncPerform(errorObject, severity, appName) {
    const oThis = this;

    const inputParams = CreateEntry._validateInputParams(errorObject, severity, appName);

    oThis._setVariables(inputParams.appName);

    await oThis._insertEntry(inputParams.severity, inputParams.kind, inputParams.data);
  }

  /**
   * Validate input parameters.
   *
   * @param {Object} errorObject
   * @param {String} severity
   *
   * @return {*}
   *
   * @private
   */
  static _validateInputParams(errorObject, severity, appName) {
    const kind = errorObject.internalErrorCode,
      data = JSON.stringify(errorObject.getDebugData({}));

    if (!severity) {
      logger.error('Severity not sent. Setting as high.');
      severity = errorLogsConstants.highSeverity;
    }

    if (!kind || !data) {
      logger.error('Mandatory parameters missing. Please send correct error object.');

      return Promise.reject(new Error('Mandatory parameters missing. Please send correct error object.'));
    }

    if (!(typeof severity === 'string') || !(typeof kind === 'string')) {
      return Promise.reject(new TypeError('Data types of severity and kind should be string.'));
    }

    if (!errorLogsConstants.severities.includes(severity)) {
      return Promise.reject(new Error('Invalid severity.'));
    }

    if (appName && !errorLogsConstants.appNames.includes(appName)) {
      return Promise.reject(new Error(`Invalid appName.-${appName}`));
    }

    return {
      severity: severity,
      kind: kind,
      data: data,
      appName: appName
    };
  }

  /**
   * Set variables from core environment variables.
   *
   * @private
   */
  _setVariables(appName) {
    const oThis = this;

    oThis.envIdentifier = coreConstants.ENV_IDENTIFIER;
    oThis.appName = appName || coreConstants.APP_NAME;
    oThis.ipAddress = coreConstants.IP_ADDRESS;
  }

  /**
   * Insert entry in error_logs table.
   *
   * @param {String} severity
   * @param {String} kind
   * @param {String} data
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _insertEntry(severity, kind, data) {
    const oThis = this;

    await new ErrorLogs()
      .insert({
        app: oThis.appName,
        env_id: oThis.envIdentifier,
        severity: severity,
        machine_ip: oThis.ipAddress,
        kind: kind,
        data: data,
        status: errorLogsConstants.createdStatus,
        created_at: new Date(),
        updated_at: new Date()
      })
      .fire();

    logger.log('Entry created successfully in error_logs table.');
  }
}

module.exports = new CreateEntry();
