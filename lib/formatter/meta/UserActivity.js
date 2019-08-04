/**
 * Formatter for users activity meta entity to convert keys to snake case.
 *
 * @module lib/formatter/meta/UserActivity
 */

const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

/**
 * Class for users activity meta entity to convert keys to snake case.
 *
 * @class UserActivityMeta
 */
class UserActivityMeta extends BaseMetaFormatter {
  /**
   * Append service specific keys in meta
   *
   * @param meta
   * @private
   */
  _appendSpecificMetaData(meta) {
    const oThis = this;

    meta.profile_user_id = oThis.meta.profileUserId;

    return meta;
  }
}

module.exports = UserActivityMeta;
