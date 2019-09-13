/**
 * Formatter for users search meta entity to convert keys to snake case.
 *
 * @module lib/formatter/meta/InviteUserSearch
 */

const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for users feed meta entity to convert keys to snake case.
 *
 * @class InviteUserSearchMeta
 */
class InviteUserSearchMeta extends BaseMetaFormatter {
  /**
   * Append service specific keys in meta
   *
   * @param meta
   * @private
   */
  _appendSpecificMetaData(meta) {
    const oThis = this;

    meta[paginationConstants.totalNoKey] = oThis.meta[paginationConstants.totalNoKey];
    return meta;
  }
}

module.exports = InviteUserSearchMeta;
