/**
 * Formatter for users search meta entity to convert keys to snake case.
 *
 * @module lib/formatter/meta/UserSearch
 */

const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

/**
 * Class for users feed meta entity to convert keys to snake case.
 *
 * @class UserSearchMeta
 */
class UserSearchMeta extends BaseMetaFormatter {
  /**
   * Append service specific keys in meta
   *
   * @param meta
   * @private
   */
  _appendSpecificMetaData(meta) {
    return meta;
  }
}

module.exports = UserSearchMeta;
