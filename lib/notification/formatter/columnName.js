const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util'),
  columnNameMap = require(rootPrefix + '/lib/notification/config/columnName.json');

let shortToLongNames = null;

/**
 * Class to get short and long names of columns.
 *
 * @class ColumnName
 */
class ColumnName {
  get longToShortNamesMap() {
    return columnNameMap;
  }

  get shortToLongNamesMap() {
    shortToLongNames = shortToLongNames ? shortToLongNames : util.invert(columnNameMap);

    return shortToLongNames;
  }
}

module.exports = new ColumnName();
