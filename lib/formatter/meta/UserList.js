/**
 * Formatter for users list meta entity to convert keys to snake case.
 *
 * @module lib/formatter/meta/UserList
 */

const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

/**
 * Class for users list meta formatter.
 *
 * @class UserList
 */
class UserList extends BaseMetaFormatter {
  /**
   * Append service specific keys in meta
   *
   * @param meta
   * @private
   */
  _appendSpecificMetaData(meta) {
    const oThis = this;

    return oThis._checkForExtraDataInMeta(meta);
  }

  _checkForExtraDataInMeta(meta) {
    const oThis = this;

    if (oThis.meta.search_term) {
      meta.search_term = oThis.meta.search_term;
    }

    if (oThis.meta.search_kind) {
      meta.search_kind = oThis.meta.search_kind;
    }

    return meta;
  }
}

module.exports = UserList;
