const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const has = Object.prototype.hasOwnProperty; // Cache the lookup once, in module scope.

/**
 * Base class for formatter.
 *
 * @class BaseFormatter
 */
class BaseFormatter {
  /**
   * Main performer for class.
   *
   * @returns {*|result}
   */
  perform() {
    const oThis = this;

    const validationResponse = oThis._validate();

    if (validationResponse.isFailure()) {
      return validationResponse;
    }

    return oThis._format();
  }

  /**
   * Validate object parameters.
   *
   * @param {object} validationObject
   * @param {object} keyConfig
   *
   * @returns {result}
   * @private
   */
  _validateParameters(validationObject, keyConfig) {
    const missingKeys = [],
      invalidKeys = [];

    for (const key in keyConfig) {
      // If key exists in object.
      if (has.call(validationObject, key)) {
        const keySpecificConfig = keyConfig[key];

        if (
          CommonValidator.isVarUndefined(validationObject[key]) ||
          (!keySpecificConfig.isNullAllowed && CommonValidator.isVarNull(validationObject[key]))
        ) {
          invalidKeys.push(key);
        }
      } else {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0 || invalidKeys.length > 0) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_b_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          object: validationObject,
          keyConfig: keyConfig,
          missingKeys: missingKeys,
          invalidKeys: invalidKeys
        }
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Format
   *
   * @returns {result}
   * @private
   */
  _format() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = BaseFormatter;
