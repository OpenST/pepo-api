/**
 * Formatter for users video list meta entity to convert keys to snake case.
 *
 * @module lib/formatter/meta/UserVideoList
 */

const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

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
