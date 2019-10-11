const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

/**
 * Class for invited users search meta formatter.
 *
 * @class InvitedUsersSearchMeta
 */
class InvitedUsersSearchMeta extends BaseMetaFormatter {
  /**
   * Append service specific keys in meta.
   *
   * @param {object} meta
   *
   * @private
   */
  _appendSpecificMetaData(meta) {
    return meta;
  }
}

module.exports = InvitedUsersSearchMeta;
