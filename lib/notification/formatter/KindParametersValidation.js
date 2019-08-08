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
    const missingParameters = {},
      invalidParameters = {},
      finalParameters = {};

    const mandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
      parametersConfig.mandatory,
      inputParameters
    );
    Object.assign(missingParameters, mandatoryParametersValidationResponse.missingParameters);
    Object.assign(invalidParameters, mandatoryParametersValidationResponse.invalidParameters);
    Object.assign(finalParameters, mandatoryParametersValidationResponse.finalParameters);

    const optionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
      parametersConfig.optional,
      inputParameters
    );
    Object.assign(missingParameters, optionalParametersValidationResponse.missingParameters);
    Object.assign(invalidParameters, optionalParametersValidationResponse.invalidParameters);
    Object.assign(finalParameters, optionalParametersValidationResponse.finalParameters);

    if (
      CommonValidator.validateNonEmptyObject(missingParameters) &&
      CommonValidator.validateNonEmptyObject(invalidParameters)
    ) {
      return responseHelper.error({
        missingParameters: missingParameters,
        invalidParameters: invalidParameters
      });
    }

    return responseHelper.successWithData({ finalParameters });
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
        const innerLevelParameters = {};
        const innerLevelMandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          mandatoryParametersConfig[parameterName].mandatory,
          inputParameters
        );
        Object.assign(missingParameters, innerLevelMandatoryParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelMandatoryParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelParameters, innerLevelMandatoryParametersValidationResponse.finalParameters);

        const innerLevelOptionalParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          mandatoryParametersConfig[parameterName].optional,
          inputParameters
        );
        Object.assign(missingParameters, innerLevelOptionalParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelOptionalParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelParameters, innerLevelOptionalParametersValidationResponse.finalParameters);

        finalParameters[parameterName] = innerLevelParameters;
      } else if (!inputParameters.hasOwnProperty(parameterName)) {
        missingParameters[parameterName] = 1;
      } else if (CommonValidator.isVarUndefined(inputParameters[parameterName])) {
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
        const innerLevelParameters = {};
        const innerLevelOptionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
          optionalParametersConfig[parameterName].optional,
          inputParameters
        );

        Object.assign(invalidParameters, innerLevelOptionalParametersValidationResponse.invalidParameters);
        Object.assign(missingParameters, innerLevelOptionalParametersValidationResponse.missingParameters);
        Object.assign(innerLevelParameters, innerLevelOptionalParametersValidationResponse.finalParameters);

        const innerLevelMandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          optionalParametersConfig[parameterName].mandatory,
          inputParameters
        );
        Object.assign(missingParameters, innerLevelMandatoryParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelMandatoryParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelParameters, innerLevelMandatoryParametersValidationResponse.finalParameters);
        finalParameters[parameterName] = innerLevelParameters;
      } else if (CommonValidator.isVarUndefined(inputParameters[parameterName])) {
        invalidParameters[parameterName] = 1;
      } else {
        finalParameters[parameterName] = inputParameters[parameterName];
      }
    }

    return { missingParameters, invalidParameters, finalParameters };
  }
}

module.exports = KindParametersValidation;
