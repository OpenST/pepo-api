const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for report issue.
 *
 * @class ReportIssue
 */
class ReportIssue extends ServiceBase {
  /**
   * Constructor for ReportIssue service.
   *
   * @param {object} params
   * @param {string} [params.app_name]
   * @param {string} [params.kind]
   * @param {string} [params.error_data]
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
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._createErrorLogEntry();

    return responseHelper.successWithData({});
  }

  /**
   * Validate params.
   *
   * @sets oThis.appName, oThis.kind
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    oThis.appName = oThis.appName.toLowerCase();
    oThis.kind = oThis.kind ? oThis.kind : 'a_s_ri';

    const allowedAppNames = errorLogsConstants.appNames;
    if (allowedAppNames.indexOf(oThis.appName) === -1) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ri_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_app_name'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Create entry in error logs.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _createErrorLogEntry() {
    const oThis = this;

    const errorObject = responseHelper.error({
      internal_error_identifier: oThis.kind,
      api_error_identifier: 'something_went_wrong',
      debug_options: oThis.errorData
    });

    return createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity, oThis.appName);
  }
}

module.exports = ReportIssue;
