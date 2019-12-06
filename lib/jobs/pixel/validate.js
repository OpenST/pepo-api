const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  pixelIdentifierParameterConfig = require(rootPrefix + '/lib/jobs/pixel/config');

/**
 * Class to validate pixel identifier parameters.
 *
 * @class ValidatePixelIdentifierParams
 */
class ValidatePixelIdentifierParams {
  /**
   * Validate pixel parameters for pixel identifier and message payload.
   *
   * @param {string} pixelIdentifier
   * @param {object} messagePayload
   *
   * @returns {*|result}
   */
  validateForPixelIdentifier(pixelIdentifier, messagePayload) {
    const oThis = this;

    const defaultParametersValidationResponse = oThis.validateDefaultMandatoryParameters(messagePayload);
    if (!defaultParametersValidationResponse) {
      return responseHelper.error({
        internal_error_identifier: 'l_j_p_v_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { messagePayload: messagePayload }
      });
    }

    const pixelIdentifierMandatoryParametersValidationResponse = oThis.validatePixelIdentifierMandatoryParameters(
      pixelIdentifier,
      messagePayload
    );
    if (!pixelIdentifierMandatoryParametersValidationResponse) {
      return responseHelper.error({
        internal_error_identifier: 'l_j_p_v_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { entityType: pixelIdentifier, messagePayload: messagePayload }
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
   * @param {string} pixelIdentifier
   * @param {object} messagePayload
   *
   * @returns {boolean}
   */
  validatePixelIdentifierMandatoryParameters(pixelIdentifier, messagePayload) {
    const pixelIdentifierMandatoryParameters = pixelIdentifierParameterConfig[pixelIdentifier].mandatory;

    for (let index = 0; index < pixelIdentifierMandatoryParameters.length; index++) {
      const mandatoryKey = pixelIdentifierMandatoryParameters[index];

      if (
        !Object.prototype.hasOwnProperty.call(messagePayload, mandatoryKey) ||
        CommonValidators.isVarNullOrUndefined(messagePayload[mandatoryKey])
      ) {
        return false;
      }
    }

    return true;
  }
}

module.exports = new ValidatePixelIdentifierParams();
