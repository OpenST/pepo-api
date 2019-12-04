const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  pixelEntityTypeConfig = require(rootPrefix + '/lib/jobs/pixels/config');

/**
 * Class to validate pixel entity type parameters.
 *
 * @class ValidateEntityTypeParams
 */
class ValidateEntityTypeParams {
  /**
   * Validate pixel parameters for entity type and message payload.
   *
   * @param {string} entityType
   * @param {object} messagePayload
   *
   * @returns {*|result}
   */
  validateForEntityType(entityType, messagePayload) {
    const oThis = this;

    const defaultParametersValidationResponse = oThis.validateDefaultMandatoryParameters(messagePayload);
    if (!defaultParametersValidationResponse) {
      responseHelper.error({
        internal_error_identifier: 'l_j_p_v_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { messagePayload: messagePayload }
      });
    }

    const entityTypeMandatoryParametersValidationResponse = oThis.validateEntityTypeMandatoryParameters(
      entityType,
      messagePayload
    );
    if (!entityTypeMandatoryParametersValidationResponse) {
      responseHelper.error({
        internal_error_identifier: 'l_j_p_v_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { entityType: entityType, messagePayload: messagePayload }
      });
    }

    const entityTypeOptionalParametersValidationResponse = oThis.validateEntityTypeOptionalParameters(
      entityType,
      messagePayload
    );
    if (!entityTypeOptionalParametersValidationResponse) {
      responseHelper.error({
        internal_error_identifier: 'l_j_p_v_3',
        api_error_identifier: 'something_went_wrong',
        debug_options: { entityType: entityType, messagePayload: messagePayload }
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate default mandatory parameters.
   *
   * @param {object} messagePayload
   *
   * @returns {boolean}
   */
  validateDefaultMandatoryParameters(messagePayload) {
    const pixelMandatoryKeys = pixelConstants.mandatoryKeys;
    for (let index = 0; index < pixelMandatoryKeys.length; index++) {
      const mandatoryKey = pixelMandatoryKeys[index];

      if (!Object.prototype.hasOwnProperty.call(messagePayload, mandatoryKey) || !messagePayload[mandatoryKey]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate entity type mandatory parameters.
   *
   * @param {string} entityType
   * @param {object} messagePayload
   *
   * @returns {boolean}
   */
  validateEntityTypeMandatoryParameters(entityType, messagePayload) {
    const pixelEntityTypeMandatoryParameters = pixelEntityTypeConfig[entityType].mandatory;
    for (let index = 0; index < pixelEntityTypeMandatoryParameters.length; index++) {
      const mandatoryKey = pixelEntityTypeMandatoryParameters[index];

      if (!Object.prototype.hasOwnProperty.call(messagePayload, mandatoryKey) || !messagePayload[mandatoryKey]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate entity type optional parameters.
   *
   * @param {string} entityType
   * @param {object} messagePayload
   *
   * @returns {boolean}
   */
  validateEntityTypeOptionalParameters(entityType, messagePayload) {
    const pixelEntityTypeOptionalParameters = pixelEntityTypeConfig[entityType].optional;
    for (let index = 0; index < pixelEntityTypeOptionalParameters.length; index++) {
      const optionalKey = pixelEntityTypeOptionalParameters[index];

      if (Object.prototype.hasOwnProperty.call(messagePayload, optionalKey) && !messagePayload[optionalKey]) {
        return false;
      }
    }

    return true;
  }
}

module.exports = new ValidateEntityTypeParams();
