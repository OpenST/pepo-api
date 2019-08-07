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
      invalidParameters = {};

    const mandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
      parametersConfig.mandatory,
      inputParameters
    );
    Object.assign(missingParameters, mandatoryParametersValidationResponse.missingParameters);
    Object.assign(invalidParameters, mandatoryParametersValidationResponse.invalidParameters);

    const optionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
      parametersConfig.optional,
      inputParameters
    );
    Object.assign(missingParameters, optionalParametersValidationResponse.missingParameters);
    Object.assign(invalidParameters, optionalParametersValidationResponse.invalidParameters);

    if (
      CommonValidator.validateNonEmptyObject(missingParameters) &&
      CommonValidator.validateNonEmptyObject(invalidParameters)
    ) {
      return responseHelper.successWithData({});
    }

    return responseHelper.error({
      missingParameters: missingParameters,
      invalidParameters: invalidParameters
    });
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
      invalidParameters = {};

    for (const parameterName in mandatoryParametersConfig) {
      if (typeof mandatoryParametersConfig[parameterName] === 'object') {
        const innerLevelMandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          mandatoryParametersConfig[parameterName].mandatory,
          inputParameters[parameterName]
        );
        Object.assign(missingParameters, innerLevelMandatoryParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelMandatoryParametersValidationResponse.invalidParameters);

        const innerLevelOptionalParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          mandatoryParametersConfig[parameterName].optional,
          inputParameters[parameterName]
        );
        Object.assign(invalidParameters, innerLevelOptionalParametersValidationResponse.invalidParameters);
      } else if (!inputParameters.hasOwnProperty(parameterName)) {
        missingParameters[parameterName] = 1;
      } else if (CommonValidator.isVarUndefined(inputParameters[parameterName])) {
        invalidParameters[parameterName] = 1;
      }
    }

    return { missingParameters: missingParameters, invalidParameters: invalidParameters };
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
      missingParameters = {};

    for (const parameterName in optionalParametersConfig) {
      if (CommonValidator.isVarUndefined(inputParameters[parameterName])) {
        invalidParameters[parameterName] = 1;
      }

      if (typeof optionalParametersConfig[parameterName] === 'object') {
        const innerLevelOptionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
          optionalParametersConfig[parameterName].optional,
          inputParameters[parameterName]
        );

        Object.assign(invalidParameters, innerLevelOptionalParametersValidationResponse.invalidParameters);
        Object.assign(missingParameters, innerLevelOptionalParametersValidationResponse.missingParameters);

        const innerLevelMandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          optionalParametersConfig[parameterName].mandatory,
          inputParameters[parameterName]
        );
        Object.assign(missingParameters, innerLevelMandatoryParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelMandatoryParametersValidationResponse.invalidParameters);
      }
    }

    return { missingParameters: missingParameters, invalidParameters: invalidParameters };
  }
}

module.exports = KindParametersValidation;
