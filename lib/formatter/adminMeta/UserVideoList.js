/**
 * Formatter for users video list meta entity to convert keys to snake case.
 *
 * @module lib/formatter/adminMeta/UserVideoList
 */

const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/Base');

/**
 * Class for user video list meta formatter.
 *
 * @class UserVideoList
 */
class UserVideoList extends BaseMetaFormatter {
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

module.exports = UserVideoList;
