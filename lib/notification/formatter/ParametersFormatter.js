const rootPrefix = '../../..',
  DynamicColumn = require(rootPrefix + '/lib/notification/formatter/DynamicColumn'),
  KindParametersValidation = require(rootPrefix + '/lib/notification/formatter/KindParametersValidation'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

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

    if (!notificationKind && !userNotificationConstants.invertedKinds[notificationKind]) {
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

    return ParametersFormatter.dynamicColumnNameReplacement(
      kindSpecificInvertedDynamicColumnMapping,
      sanitizedParameters
    );
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

    return ParametersFormatter.dynamicColumnNameReplacement(kindSpecificDynamicColumnMapping, databaseParameters);
  }

  /**
   * Dynamic column name replacement.
   *
   * @param {object} dynamicColumnConfig
   * @param {object} inputParameters
   *
   * @returns {*}
   */
  static dynamicColumnNameReplacement(dynamicColumnConfig, inputParameters) {
    for (const parameterName in dynamicColumnConfig) {
      if (inputParameters.hasOwnProperty(parameterName)) {
        const newKey = dynamicColumnConfig[parameterName];
        const oldKey = parameterName;
        // Replace old key with new key.
        if (newKey !== oldKey) {
          delete Object.assign(inputParameters, { [newKey]: inputParameters[oldKey] })[oldKey];
        }
      }
    }

    return inputParameters;
  }

  /**
   * Shorten column name.
   *
   * @param {object} dynamicColumnReplacedParameters
   *
   * @returns {*}
   */
  static shortenColumnName(dynamicColumnReplacedParameters) {
    const longToShortColumnNamesMap = userNotificationConstants.longToShortNamesMap;

    return ParametersFormatter.columnNameReplacement(longToShortColumnNamesMap, dynamicColumnReplacedParameters);
  }

  /**
   * Lengthen column name.
   *
   * @param {object} dynamicColumnReplacedParameters
   *
   * @returns {*}
   */
  static lengthenColumnName(dynamicColumnReplacedParameters) {
    const shortToLongColumnNamesMap = userNotificationConstants.shortToLongNamesMap;

    return ParametersFormatter.columnNameReplacement(shortToLongColumnNamesMap, dynamicColumnReplacedParameters);
  }

  /**
   * Replace column names.
   *
   * @param {object} columnConfig
   * @param {object} dynamicColumnReplacedParameters
   *
   * @returns {*}
   */
  static columnNameReplacement(columnConfig, dynamicColumnReplacedParameters) {
    for (const columnName in dynamicColumnReplacedParameters) {
      if (typeof dynamicColumnReplacedParameters[columnName] === 'object') {
        const columnObject = dynamicColumnReplacedParameters[columnName];

        for (const key in columnObject) {
          if (columnConfig.hasOwnProperty(key)) {
            const oldKey = key;
            const newKey = columnConfig[key];
            if (newKey !== oldKey) {
              delete Object.assign(dynamicColumnReplacedParameters[columnName], {
                [newKey]: dynamicColumnReplacedParameters[columnName][oldKey]
              })[oldKey];
            }
          }
        }
      }

      if (columnConfig.hasOwnProperty(columnName)) {
        const oldKey = columnName;
        const newKey = columnConfig[columnName];
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

    columnName = userNotificationConstants.longToShortNamesMap[columnName]
      ? userNotificationConstants.longToShortNamesMap[columnName]
      : columnName;

    return columnName;
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
    shortenedName = userNotificationConstants.shortToLongNamesMap[shortenedName]
      ? userNotificationConstants.shortToLongNamesMap[shortenedName]
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
