const rootPrefix = '../../..',
  DynamicColumn = require(rootPrefix + '/lib/notification/formatter/DynamicColumn'),
  ColumnNameReplacement = require(rootPrefix + '/lib/notification/formatter/ColumnName'),
  KindParametersValidation = require(rootPrefix + '/lib/notification/formatter/KindParametersValidation'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

// data type conversion for queries
//reverse data type conversion
//todo: for updates we need a function that can return the final key for db
//todo: for updates we need a function that takes a map as input and returns the formatted map.

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

    const dynamicColumnReplacedParameters = ParametersFormatter.replaceColumnNamesWithDynamicName(
      notificationKind,
      sanitizedParameters
    );

    const replacedInsertionParameters = ParametersFormatter.shortenColumnName(dynamicColumnReplacedParameters);

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
   *
   * @returns {{}}
   */
  static replaceColumnNamesWithDynamicName(kind, sanitizedParameters) {
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

    return sanitizedParameters;
  }

  /**
   * Shorten column name.
   *
   * @param {object} dynamicColumnReplacedParameters
   *
   * @returns {*}
   */
  static shortenColumnName(dynamicColumnReplacedParameters) {
    const longToShortColumnNamesMap = ColumnNameReplacement.longToShortNamesMap;

    for (const columnName in dynamicColumnReplacedParameters) {
      if (typeof dynamicColumnReplacedParameters[columnName] === 'object') {
        const columnObject = dynamicColumnReplacedParameters[columnName];

        for (const key in columnObject) {
          if (longToShortColumnNamesMap.hasOwnProperty(key)) {
            const oldKey = key;
            const newKey = longToShortColumnNamesMap[key];
            if (newKey !== oldKey) {
              delete Object.assign(dynamicColumnReplacedParameters[columnName], {
                [newKey]: dynamicColumnReplacedParameters[columnName][oldKey]
              })[oldKey];
            }
          }
        }
      }

      if (longToShortColumnNamesMap.hasOwnProperty(columnName)) {
        const oldKey = columnName;
        const newKey = longToShortColumnNamesMap[columnName];
        // Replace old key with new key.
        if (newKey !== oldKey) {
          delete Object.assign(dynamicColumnReplacedParameters, { [newKey]: dynamicColumnReplacedParameters[oldKey] })[
            oldKey
          ];
        }
      }
    }

    return dynamicColumnReplacedParameters;
  }
}

module.exports = ParametersFormatter;
