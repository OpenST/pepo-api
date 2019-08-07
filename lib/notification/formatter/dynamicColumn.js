const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util'),
  dynamicColumnMap = require(rootPrefix + '/lib/notification/config/dynamicColumn');

const kindSpecificDynamicColumnMapping = {},
  kindSpecificInvertedDynamicColumnMapping = {};

/**
 * Class for dynamic columns formatter.
 *
 * @class DynamicColumn
 */
class DynamicColumn {
  /**
   * Get kind specific dynamic column mapping.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  getKindSpecificDynamicColumnMapping(kind) {
    if (kindSpecificDynamicColumnMapping[kind]) {
      return kindSpecificDynamicColumnMapping[kind];
    }

    for (const columnName in dynamicColumnMap) {
      const columnMapping = dynamicColumnMap[columnName];
      for (const notificationKind in columnMapping) {
        kindSpecificDynamicColumnMapping[notificationKind] = kindSpecificDynamicColumnMapping[notificationKind] || {};
        kindSpecificDynamicColumnMapping[notificationKind][columnName] = columnMapping[notificationKind];
      }
    }

    return kindSpecificDynamicColumnMapping[kind];
  }

  /**
   * Get kind specific inverted dynamic column mapping.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  getKindSpecificInvertedDynamicColumnMapping(kind) {
    const oThis = this;

    kindSpecificInvertedDynamicColumnMapping[kind] = kindSpecificInvertedDynamicColumnMapping[kind]
      ? kindSpecificInvertedDynamicColumnMapping[kind]
      : util.invert(oThis.getKindSpecificDynamicColumnMapping(kind));

    return kindSpecificInvertedDynamicColumnMapping[kind];
  }
}

module.exports = new DynamicColumn();
