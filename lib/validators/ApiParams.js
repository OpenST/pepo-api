const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  v1Config = require(rootPrefix + '/config/apiParams/v1/signature'),
  webConfig = require(rootPrefix + '/config/apiParams/web/signature'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  adminConfig = require(rootPrefix + '/config/apiParams/admin/signature');

/**
 * Class for API params validation.
 *
 * @class ApiParamsValidator
 */
class ApiParamsValidator {
  /**
   * Constructor for API params validation.
   *
   * @param {object} params
   * @param {string} params.api_name: human readable name of API Fired - used for finding the mandatory and optional params
   * @param {string} params.api_version: API Version
   * @param {object} params.api_params: object containing params sent in request
   *
   * @constructor
   *
   * @param {Object} params
   * @param {boolean} params.api_name - human readable name of API Fired - used for finding the mandatory and optional params
   * @param {boolean} params.api_version - API Version
   * @param {Object} params.api_params - object containing Params sent in request
   */
  constructor(params) {
    const oThis = this;

    oThis.apiName = params.api_name;
    oThis.apiVersion = params.api_version;
    oThis.apiParams = params.api_params;

    oThis.paramsConfig = null;
    oThis.sanitisedApiParams = {};
    oThis.paramErrors = [];
    oThis.dynamicErrorConfig = {};
  }

  /**
   * Main performer for class.
   *
   * @return {promise<result>}
   */
  async perform() {
    const oThis = this;

    console.log('oThis.apiParams--------', JSON.stringify(oThis.apiParams));

    await oThis._fetchParamsConfig();

    await oThis._validateMandatoryParams();

    await oThis._checkOptionalParams();

    return oThis._responseData();
  }

  /**
   * Fetch params config for an API.
   *
   * @sets oThis.paramsConfig
   *
   * @private
   * @return {Promise<result>}
   */
  async _fetchParamsConfig() {
    const oThis = this;

    let versionConfig = {};

    if (oThis.apiVersion === apiVersions.v1) {
      versionConfig = v1Config;
    } else if (oThis.apiVersion === apiVersions.admin) {
      versionConfig = adminConfig;
    } else if (oThis.apiVersion === apiVersions.web) {
      versionConfig = webConfig;
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_v_ap_2',
          api_error_identifier: 'invalid_api_version',
          debug_options: {}
        })
      );
    }

    oThis.paramsConfig = versionConfig[oThis.apiName];

    if (!oThis.paramsConfig) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_v_ap_3',
          api_error_identifier: 'invalid_api_name',
          debug_options: { apiName: oThis.apiName }
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate mandatory parameters.
   *
   * @private
   * @return {result}
   */
  async _validateMandatoryParams() {
    const oThis = this;

    const mandatoryKeys = oThis.paramsConfig.mandatory || [];

    for (let index = 0; index < mandatoryKeys.length; index++) {
      const whiteListedKeyConfig = mandatoryKeys[index],
        whiteListedKeyName = whiteListedKeyConfig.parameter;

      if (
        Object.prototype.hasOwnProperty.call(oThis.apiParams, whiteListedKeyName) &&
        !CommonValidators.isVarNullOrUndefined(oThis.apiParams[whiteListedKeyName])
      ) {
        // Validate value as per method name passed in config
        oThis._validateValue({ keyName: whiteListedKeyName, keyConfig: whiteListedKeyConfig });
      } else {
        oThis.paramErrors.push(`missing_${whiteListedKeyName}`);
        oThis.dynamicErrorConfig[`missing_${whiteListedKeyName}`] = {
          parameter: whiteListedKeyName,
          code: 'missing',
          message:
            'Required parameter ' +
            whiteListedKeyName +
            ' is missing. Please inspect for what is being sent, rectify and re-submit.'
        };
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Check optional params
   *
   * @private
   *
   * @return {result}
   */
  async _checkOptionalParams() {
    const oThis = this;

    const optionalKeysConfig = oThis.paramsConfig.optional || [];

    for (let index = 0; index < optionalKeysConfig.length; index++) {
      const optionalKeyConfig = optionalKeysConfig[index],
        optionalKeyName = optionalKeyConfig.parameter;

      if (
        Object.prototype.hasOwnProperty.call(oThis.apiParams, optionalKeyName) &&
        !CommonValidators.isVarNullOrUndefined(oThis.apiParams[optionalKeyName])
      ) {
        // Validate value as per method name passed in config
        oThis._validateValue({ keyName: optionalKeyName, keyConfig: optionalKeyConfig });
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate param value with the validator config.
   *
   * @param {object} params
   * @param {string} params.keyName
   * @param {object} params.keyConfig
   *
   * @private
   * @return {result}
   */
  async _validateValue(params) {
    const oThis = this;

    const keyName = params.keyName,
      keyConfig = params.keyConfig;

    // Validate value as per method name passed in config.
    const valueToValidate = oThis.apiParams[keyName],
      validatorMethodNames = keyConfig.validatorMethods;

    for (let index = 0; index < validatorMethodNames.length; index++) {
      const validatorMethodName = validatorMethodNames[index],
        validatorMethodInstance = CommonValidators[validatorMethodName];

      let isValueValid = null;

      if (validatorMethodInstance) {
        isValueValid = validatorMethodInstance.apply(CommonValidators, [valueToValidate]);
      } else {
        isValueValid = false;
        logger.error(`${validatorMethodName} does not exist.`);
      }

      if (!isValueValid) {
        oThis.paramErrors.push(`invalid_${keyName}`);
        oThis.dynamicErrorConfig[`invalid_${keyName}`] = {
          parameter: keyName,
          code: 'invalid',
          message: 'Invalid parameter ' + keyName + '.  Please ensure the input is well formed.'
        };

        return false;
      }
    }

    oThis.sanitisedApiParams[keyName] = valueToValidate;

    return true;
  }

  /**
   * API params validation response.
   *
   * @private
   * @return {result}
   */
  async _responseData() {
    const oThis = this;

    if (oThis.paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'v_ap_rd_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: oThis.paramErrors,
          error_config: basicHelper.fetchErrorConfig(oThis.apiVersion, oThis.dynamicErrorConfig),
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({ sanitisedApiParams: oThis.sanitisedApiParams });
  }
}

module.exports = ApiParamsValidator;
