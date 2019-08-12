const rootPrefix = '../../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  kindSpecificParameters = require(rootPrefix + '/lib/notification/config/kindParameters');

/**
 * Class for kind specific parameters validations.
 *
 * @class KindParametersValidation
 */
class KindParametersValidation {
  /**
   * Validate parameters for specific kind.
   *
   * @param {string} kind
   * @param {object} inputParameters
   *
   * @returns {result}
   */
  static validateParametersForKind(kind, inputParameters) {
    const parametersConfig = kindSpecificParameters[kind];
    if (!parametersConfig) {
      return responseHelper.error({
        internal_error_identifier: 'l_n_f_kpv_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { kind: kind }
      });
    }
    const missingParameters = {},
      invalidParameters = {},
      sanitizedParameters = {};

    if (!parametersConfig.mandatory && !parametersConfig.optional) {
      return responseHelper.error({
        internal_error_identifier: 'l_n_f_kpv_2',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { kind: kind, parametersConfig: parametersConfig }
      });
    }

    const mandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
      parametersConfig.mandatory,
      inputParameters
    );
    Object.assign(missingParameters, mandatoryParametersValidationResponse.missingParameters);
    Object.assign(invalidParameters, mandatoryParametersValidationResponse.invalidParameters);
    Object.assign(sanitizedParameters, mandatoryParametersValidationResponse.finalParameters);

    const optionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
      parametersConfig.optional,
      inputParameters
    );
    Object.assign(missingParameters, optionalParametersValidationResponse.missingParameters);
    Object.assign(invalidParameters, optionalParametersValidationResponse.invalidParameters);
    Object.assign(sanitizedParameters, optionalParametersValidationResponse.finalParameters);

    if (
      CommonValidator.validateNonEmptyObject(missingParameters) ||
      CommonValidator.validateNonEmptyObject(invalidParameters)
    ) {
      return responseHelper.error({
        internal_error_identifier: 'l_n_f_kpv_3',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          missingParameters: missingParameters,
          invalidParameters: invalidParameters
        }
      });
    }

    return responseHelper.successWithData({ sanitizedParameters });
  }

  /**
   * Validate mandatory parameters.
   *
   * @param {object} mandatoryParametersConfig
   * @param {object} inputParameters
   *
   * @returns {{invalidParameters: {}, missingParameters: {}}}
   */
  static validateMandatoryParameters(mandatoryParametersConfig, inputParameters) {
    const missingParameters = {},
      invalidParameters = {},
      finalParameters = {};

    for (const parameterName in mandatoryParametersConfig) {
      if (typeof mandatoryParametersConfig[parameterName] === 'object') {
        const innerLevelFinalParameters = {};
        const innerLevelMandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          mandatoryParametersConfig[parameterName].mandatory,
          inputParameters[parameterName]
        );
        Object.assign(missingParameters, innerLevelMandatoryParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelMandatoryParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelFinalParameters, innerLevelMandatoryParametersValidationResponse.finalParameters);

        const innerLevelOptionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
          mandatoryParametersConfig[parameterName].optional,
          inputParameters[parameterName]
        );
        Object.assign(missingParameters, innerLevelOptionalParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelOptionalParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelFinalParameters, innerLevelOptionalParametersValidationResponse.finalParameters);

        finalParameters[parameterName] = innerLevelFinalParameters;
      } else if (!inputParameters.hasOwnProperty(parameterName)) {
        missingParameters[parameterName] = 1;
      } else if (CommonValidator.isVarNullOrUndefined(inputParameters[parameterName])) {
        invalidParameters[parameterName] = 1;
      } else {
        finalParameters[parameterName] = inputParameters[parameterName];
      }
    }

    return { missingParameters, invalidParameters, finalParameters };
  }

  /**
   * Validate optional parameters.
   *
   * @param {object} optionalParametersConfig
   * @param {object} inputParameters
   *
   * @returns {{invalidParameters: {}, missingParameters: {}}}
   */
  static validateOptionalParameters(optionalParametersConfig, inputParameters) {
    const invalidParameters = {},
      missingParameters = {},
      finalParameters = {};

    for (const parameterName in optionalParametersConfig) {
      if (typeof optionalParametersConfig[parameterName] === 'object') {
        const innerLevelFinalParameters = {};

        const innerLevelOptionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
          optionalParametersConfig[parameterName].optional,
          inputParameters[parameterName]
        );

        Object.assign(invalidParameters, innerLevelOptionalParametersValidationResponse.invalidParameters);
        Object.assign(missingParameters, innerLevelOptionalParametersValidationResponse.missingParameters);
        Object.assign(innerLevelFinalParameters, innerLevelOptionalParametersValidationResponse.finalParameters);

        const innerLevelMandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          optionalParametersConfig[parameterName].mandatory,
          inputParameters[parameterName]
        );
        Object.assign(missingParameters, innerLevelMandatoryParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelMandatoryParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelFinalParameters, innerLevelMandatoryParametersValidationResponse.finalParameters);

        finalParameters[parameterName] = innerLevelFinalParameters;
      } else if (inputParameters.hasOwnProperty(parameterName)) {
        if (CommonValidator.isVarNullOrUndefined(inputParameters[parameterName])) {
          invalidParameters[parameterName] = 1;
        } else {
          finalParameters[parameterName] = inputParameters[parameterName];
        }
      }
    }

    Object.assign(inputParameters, finalParameters);

    return { missingParameters, invalidParameters, finalParameters };
  }
}

module.exports = KindParametersValidation;
