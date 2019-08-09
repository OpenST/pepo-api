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
      sanitizedParameters = {},
      objectTypeParameters = {};

    const mandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
      parametersConfig.mandatory,
      inputParameters
    );
    Object.assign(missingParameters, mandatoryParametersValidationResponse.missingParameters);
    Object.assign(invalidParameters, mandatoryParametersValidationResponse.invalidParameters);
    Object.assign(sanitizedParameters, mandatoryParametersValidationResponse.finalParameters);
    Object.assign(objectTypeParameters, mandatoryParametersValidationResponse.objectTypeParameters);

    const optionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
      parametersConfig.optional,
      inputParameters
    );
    Object.assign(missingParameters, optionalParametersValidationResponse.missingParameters);
    Object.assign(invalidParameters, optionalParametersValidationResponse.invalidParameters);
    Object.assign(sanitizedParameters, optionalParametersValidationResponse.finalParameters);
    Object.assign(objectTypeParameters, mandatoryParametersValidationResponse.objectTypeParameters);

    if (
      CommonValidator.validateNonEmptyObject(missingParameters) ||
      CommonValidator.validateNonEmptyObject(invalidParameters)
    ) {
      return responseHelper.error({
        missingParameters: missingParameters,
        invalidParameters: invalidParameters
      });
    }

    //todo: why merge??. Return sanitizedParameters??
    Object.assign(sanitizedParameters, inputParameters);

    //todo: why delete
    for (const parameterName in objectTypeParameters) {
      const object = sanitizedParameters[parameterName];
      for (const toBeDeletedParameterName in object) {
        delete sanitizedParameters[toBeDeletedParameterName];
      }
    }

    return responseHelper.successWithData({ sanitizedParameters, objectTypeParameters });
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
      finalParameters = {},
      objectTypeParameters = {};

    for (const parameterName in mandatoryParametersConfig) {
      if (typeof mandatoryParametersConfig[parameterName] === 'object') {
        const innerLevelFinalParameters = {};
        const innerLevelMandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          mandatoryParametersConfig[parameterName].mandatory,
          inputParameters
        );
        Object.assign(missingParameters, innerLevelMandatoryParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelMandatoryParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelFinalParameters, innerLevelMandatoryParametersValidationResponse.finalParameters);

        const innerLevelOptionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
          mandatoryParametersConfig[parameterName].optional,
          inputParameters
        );
        Object.assign(missingParameters, innerLevelOptionalParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelOptionalParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelFinalParameters, innerLevelOptionalParametersValidationResponse.finalParameters);

        finalParameters[parameterName] = innerLevelFinalParameters;
        objectTypeParameters[parameterName] = 1;
      } else if (!inputParameters.hasOwnProperty(parameterName)) {
        missingParameters[parameterName] = 1;
        //  todo: do not allow null values
      } else if (CommonValidator.isVarUndefined(inputParameters[parameterName])) {
        invalidParameters[parameterName] = 1;
      } else {
        finalParameters[parameterName] = inputParameters[parameterName];
      }
    }

    return { missingParameters, invalidParameters, finalParameters, objectTypeParameters };
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
      finalParameters = {},
      objectTypeParameters = {};

    for (const parameterName in optionalParametersConfig) {
      if (typeof optionalParametersConfig[parameterName] === 'object') {
        const innerLevelFinalParameters = {};

        //todo: check if any key of object is present. if yes then all its mandatory should have been else error

        const innerLevelOptionalParametersValidationResponse = KindParametersValidation.validateOptionalParameters(
          optionalParametersConfig[parameterName].optional,
          inputParameters
        );

        Object.assign(invalidParameters, innerLevelOptionalParametersValidationResponse.invalidParameters);
        Object.assign(missingParameters, innerLevelOptionalParametersValidationResponse.missingParameters);
        Object.assign(innerLevelFinalParameters, innerLevelOptionalParametersValidationResponse.finalParameters);

        const innerLevelMandatoryParametersValidationResponse = KindParametersValidation.validateMandatoryParameters(
          optionalParametersConfig[parameterName].mandatory,
          inputParameters
        );
        Object.assign(missingParameters, innerLevelMandatoryParametersValidationResponse.missingParameters);
        Object.assign(invalidParameters, innerLevelMandatoryParametersValidationResponse.invalidParameters);
        Object.assign(innerLevelFinalParameters, innerLevelMandatoryParametersValidationResponse.finalParameters);

        finalParameters[parameterName] = innerLevelFinalParameters;
        objectTypeParameters[parameterName] = 1;

        //  todo: it can be undefined for optional, dont set anything in that case
      } else if (CommonValidator.isVarUndefined(inputParameters[parameterName])) {
        // invalidParameters[parameterName] = 1;
      } else {
        finalParameters[parameterName] = inputParameters[parameterName];
      }
    }

    Object.assign(inputParameters, finalParameters);

    return { missingParameters, invalidParameters, finalParameters, objectTypeParameters };
  }
}

module.exports = KindParametersValidation;
