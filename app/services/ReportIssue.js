const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for Report Issue.
 *
 * @class Logout
 */
class ReportIssue extends ServiceBase {
  /**
   * Constructor for ReportIssue service.
   *
   * @param {object} params
   * @param {String} [params.app_name]
   * @param {String} [params.kind]
   * @param {String} [params.error_data]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.appName = params.app_name;
    oThis.kind = params.kind;

    oThis.errorData = params.error_data;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._createErrorLogEntry();

    return responseHelper.successWithData({});
  }

  /**
   * Validate Params
   *
   * @return {Promise<void>}
   */
  async _validateAndSanitize() {
    const oThis = this;

    oThis.appName = oThis.appName.toLowerCase();
    oThis.kind = oThis.kind ? oThis.kind : 'a_s_ri';

    let allowedAppNames = errorLogsConstants.appNames;
    if (allowedAppNames.indexOf(oThis.appName) == -1) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ri_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_app_name'],
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Create entry in Error logs.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createErrorLogEntry() {
    const oThis = this;

    const errorObject = responseHelper.error({
      internal_error_identifier: oThis.kind,
      api_error_identifier: 'something_went_wrong',
      debug_options: oThis.errorData
    });

    createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity, oThis.appName);
    return responseHelper.successWithData({});
  }
}

module.exports = ReportIssue;
