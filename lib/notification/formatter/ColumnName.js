const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util'),
  columnNameMap = require(rootPrefix + '/lib/notification/config/columnName');

let shortToLongNames = null;

/**
 * Class to get short and long names of columns.
 *
 * @class ColumnName
 */
class ColumnName {
  /**
   * Get column and attributes long to short names.
   *
   * @returns {{}}
   */
  static get longToShortNamesMap() {
    return columnNameMap;
  }

  /**
   * Get column and attributes short to long names.
   *
   * @returns {{}}
   */
  static get shortToLongNamesMap() {
    shortToLongNames = shortToLongNames ? shortToLongNames : util.invert(columnNameMap);

    return shortToLongNames;
  }
}

module.exports = ColumnName;
