const rootPrefix = '../../..',
  DynamicColumn = require(rootPrefix + '/lib/notification/formatter/DynamicColumn'),
  ColumnNameReplacement = require(rootPrefix + '/lib/notification/formatter/ColumnName'),
  KindParametersValidation = require(rootPrefix + '/lib/notification/formatter/KindParametersValidation'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

// Data type conversion for queries.
// Reverse data type conversion.
// Todo: for updates we need a function that can return the final key for db
// Todo: for updates we need a function that takes a map as input and returns the formatted map.

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
    if (!notificationKind) {
      return responseHelper.error({
        internal_error_identifier: 'l_n_f_pf_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { insertionParameters: insertionParameters }
      });
    }

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

    dynamicColumnReplacedParameters.kind = notificationKind;
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
   * Replace dynamic name.
   *
   * @param {string} kind
   * @param {object} databaseParameters
   *
   * @returns {{}}
   */
  static replaceDynamicNameWithColumnNames(kind, databaseParameters) {
    const kindSpecificDynamicColumnMapping = DynamicColumn.getDynamicColumnMapForKind(kind);

    for (const parameterName in kindSpecificDynamicColumnMapping) {
      if (databaseParameters.hasOwnProperty(parameterName)) {
        const newKey = kindSpecificDynamicColumnMapping[parameterName];
        const oldKey = parameterName;
        // Replace old key with new key.
        if (newKey !== oldKey) {
          delete Object.assign(databaseParameters, { [newKey]: databaseParameters[oldKey] })[oldKey];
        }
      }
    }

    return databaseParameters;
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

  /**
   * Lengthen column name.
   *
   * @param {object} dynamicColumnReplacedParameters
   *
   * @returns {*}
   */
  static lengthenColumnName(dynamicColumnReplacedParameters) {
    const shortToLongColumnNamesMap = ColumnNameReplacement.shortToLongNamesMap;

    for (const columnName in dynamicColumnReplacedParameters) {
      if (typeof dynamicColumnReplacedParameters[columnName] === 'object') {
        const columnObject = dynamicColumnReplacedParameters[columnName];

        for (const key in columnObject) {
          if (shortToLongColumnNamesMap.hasOwnProperty(key)) {
            const oldKey = key;
            const newKey = shortToLongColumnNamesMap[key];
            if (newKey !== oldKey) {
              delete Object.assign(dynamicColumnReplacedParameters[columnName], {
                [newKey]: dynamicColumnReplacedParameters[columnName][oldKey]
              })[oldKey];
            }
          }
        }
      }

      if (shortToLongColumnNamesMap.hasOwnProperty(columnName)) {
        const oldKey = columnName;
        const newKey = shortToLongColumnNamesMap[columnName];
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

  /**
   * Returns column name for table query.
   *
   * @param {string} columnName
   * @param {string} [kind]
   *
   * @returns {string}
   */
  static getColumnNameForQuery(columnName, kind = '') {
    if (kind) {
      columnName = DynamicColumn.getInvertedDynamicColumnMapForKind(kind)[columnName]
        ? DynamicColumn.getInvertedDynamicColumnMapForKind(kind)[columnName]
        : columnName;
    }

    columnName = ColumnNameReplacement.longToShortNamesMap[columnName]
      ? ColumnNameReplacement.longToShortNamesMap[columnName]
      : columnName;

    return columnName;
  }

  /**
   * Convert column names for insert.
   *
   * @param {object} insertParams
   * @param {string} [kind]
   *
   *  @returns {*}
   */
  static convertColumnNamesForInsert(insertParams, kind = '') {
    let dynamicColumnReplacedParameters = insertParams;
    if (kind) {
      dynamicColumnReplacedParameters = ParametersFormatter.replaceColumnNamesWithDynamicName(kind, insertParams);
    }

    return ParametersFormatter.shortenColumnName(dynamicColumnReplacedParameters);
  }

  /**
   * Returns lengthened column name.
   *
   * @param {string} shortenedName
   * @param {string} [kind]
   *
   * @returns {{string}}
   */
  static getLongColumnName(shortenedName, kind = '') {
    shortenedName = ColumnNameReplacement.shortToLongNamesMap[shortenedName]
      ? ColumnNameReplacement.shortToLongNamesMap[shortenedName]
      : shortenedName;

    if (kind) {
      shortenedName = DynamicColumn.getDynamicColumnMapForKind(kind)[shortenedName]
        ? DynamicColumn.getDynamicColumnMapForKind(kind)[shortenedName]
        : shortenedName;
    }

    return shortenedName;
  }

  /**
   * Format Db data.
   *
   * @param {object} dbParams
   * @param {string} [dbParams.kind]
   *
   * @returns {object}
   */
  static formatDbData(dbParams) {
    if (dbParams.kind) {
      dbParams = ParametersFormatter.replaceDynamicNameWithColumnNames(dbParams.kind, dbParams);
    }

    return ParametersFormatter.lengthenColumnName(dbParams);
  }
}

module.exports = ParametersFormatter;
