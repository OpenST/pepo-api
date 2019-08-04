/**
 * Formatter for users feed meta entity to convert keys to snake case.
 *
 * @module lib/formatter/meta/UserList
 */

const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

/**
 * Class for users feed meta entity to convert keys to snake case.
 *
 * @class UserFeedMeta
 */
class UserFeedMeta extends BaseMetaFormatter {
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

module.exports = UserFeedMeta;
