const rootPrefix = '../../..',
  DynamicColumn = require(rootPrefix + '/lib/notification/formatter/DynamicColumn'),
  ColumnNameReplacement = require(rootPrefix + '/lib/notification/formatter/ColumnName'),
  KindParametersValidation = require(rootPrefix + '/lib/notification/formatter/KindParametersValidation'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for formatting formatters.
 *
 * @class ParametersFormatter
 */
class ParametersFormatter {
  /**
   * Get formatted insertion parameters for kind.
   *
   * @param {object} insertionParameters
   * @param {string} insertionParameters.kind
   *
   * @returns {result}
   */
  static getInsertionParametersForKind(insertionParameters) {
    const notificationKind = insertionParameters.kind;
    const validationResponse = ParametersFormatter.validateKindSpecificParameters(
      notificationKind,
      insertionParameters
    );

    if (validationResponse.isFailure()) {
      return validationResponse;
    }

    const sanitizedParameters = validationResponse.data.sanitizedParameters;
    const objectTypeParameters = validationResponse.data.objectTypeParameters;

    const dynamicColumnReplacedParameters = ParametersFormatter.replaceColumnNamesWithDynamicName(
      notificationKind,
      sanitizedParameters,
      objectTypeParameters
    );

    const replacedInsertionParameters = ParametersFormatter.shortenColumnName(
      notificationKind,
      dynamicColumnReplacedParameters,
      objectTypeParameters
    );

    return responseHelper.successWithData({ insertParameters: replacedInsertionParameters });
  }

  /**
   * Validate kind specific parameters.
   *
   * @param {string} kind
   * @param {object} insertionParameters
   *
   * @returns {result}
   */
  static validateKindSpecificParameters(kind, insertionParameters) {
    return KindParametersValidation.validateParametersForKind(kind, insertionParameters);
  }

  /**
   * Replace column name.
   *
   * @param {string} kind
   * @param {object} sanitizedParameters
   * @param {object} objectTypeParameters
   *
   * @returns {{}}
   */
  static replaceColumnNamesWithDynamicName(kind, sanitizedParameters, objectTypeParameters) {
    const kindSpecificInvertedDynamicColumnMapping = DynamicColumn.getInvertedDynamicColumnMapForKind(kind);

    for (const parameterName in kindSpecificInvertedDynamicColumnMapping) {
      if (sanitizedParameters.hasOwnProperty(parameterName)) {
        const newKey = kindSpecificInvertedDynamicColumnMapping[parameterName];
        const oldKey = parameterName;
        // Replace old key with new key.
        if (newKey !== oldKey) {
          delete Object.assign(sanitizedParameters, { [newKey]: sanitizedParameters[oldKey] })[oldKey];
        }
      }
    }

    for (const parameterName in objectTypeParameters) {
      const parameterObject = sanitizedParameters[parameterName];
      for (const toBeReplacedParameterName in kindSpecificInvertedDynamicColumnMapping) {
        if (parameterObject.hasOwnProperty(toBeReplacedParameterName)) {
          const newKey = kindSpecificInvertedDynamicColumnMapping[toBeReplacedParameterName];
          const oldKey = toBeReplacedParameterName;
          // Replace old key with new key.
          if (newKey !== oldKey) {
            delete Object.assign(sanitizedParameters[parameterName], {
              [newKey]: sanitizedParameters[parameterName][oldKey]
            })[oldKey];
          }
        }
      }
    }

    return sanitizedParameters;
  }

  /**
   * Shorten column name.
   *
   * @param {string} kind
   * @param {object} dynamicColumnReplacedParameters
   * @param {object} objectTypeParameters
   *
   * @returns {*}
   */
  static shortenColumnName(kind, dynamicColumnReplacedParameters, objectTypeParameters) {
    const longToShortColumnNamesMap = ColumnNameReplacement.longToShortNamesMap;

    for (const columnName in longToShortColumnNamesMap) {
      if (dynamicColumnReplacedParameters.hasOwnProperty(columnName)) {
        const newKey = longToShortColumnNamesMap[columnName];
        const oldKey = columnName;
        // Replace old key with new key.
        if (newKey !== oldKey) {
          delete Object.assign(dynamicColumnReplacedParameters, { [newKey]: dynamicColumnReplacedParameters[oldKey] })[
            oldKey
          ];
        }
      }
    }

    for (const parameterName in objectTypeParameters) {
      const parameterObject = dynamicColumnReplacedParameters[parameterName];
      for (const toBeShortenedColumnName in longToShortColumnNamesMap) {
        if (parameterObject.hasOwnProperty(toBeShortenedColumnName)) {
          const newKey = longToShortColumnNamesMap[toBeShortenedColumnName];
          const oldKey = toBeShortenedColumnName;
          // Replace old key with new key.
          if (newKey !== oldKey) {
            delete Object.assign(dynamicColumnReplacedParameters[parameterName], {
              [newKey]: dynamicColumnReplacedParameters[parameterName][oldKey]
            })[oldKey];
          }
        }
      }
    }

    return dynamicColumnReplacedParameters;
  }
}

module.exports = ParametersFormatter;
