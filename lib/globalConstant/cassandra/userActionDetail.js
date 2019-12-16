const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let longToShortNamesMap, longToShortNamesForEntityKindsMap;

/**
 * Class for user action detail constants.
 *
 * @class UserActionDetailConstants
 */
class UserActionDetailConstants {
  get shortToLongNamesMap() {
    return {
      u_id: 'userId',
      e_i: 'entityIdentifier',
      l_r_t: 'lastReplyTimestamp',
      l_r_c_t: 'lastReplyContributionTimestamp',
      l_v_c_t: 'lastVideoContributionTimestamp',
      u_c_t: 'userContributionTimestamp'
    };
  }

  get longToShortNamesMap() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMap);

    return longToShortNamesMap;
  }

  ///////////// Kind Start //////////////////

  get videoEntityKind() {
    return 'VIDEO';
  }

  get userEntityKind() {
    return 'USER';
  }

  get videoEntityKindShort() {
    return 'v';
  }

  get userEntityKindShort() {
    return 'u';
  }

  get shortToLongNamesMapForEntityKind() {
    const oThis = this;

    return {
      [oThis.videoEntityKindShort]: oThis.videoEntityKind,
      [oThis.userEntityKindShort]: oThis.userEntityKind
    };
  }

  get longToShortNamesMapForEntityKind() {
    const oThis = this;

    longToShortNamesForEntityKindsMap =
      longToShortNamesForEntityKindsMap || util.invert(oThis.shortToLongNamesMapForEntityKind);

    return longToShortNamesForEntityKindsMap;
  }

  /**
   * Create entity identifier with entity kind and id.
   *
   * @param entityKind - long name expected here
   * @param entityId
   * @returns {string}
   */
  createEntityIdentifier(entityKind, entityId) {
    const oThis = this;
    const entityKindShort = oThis.longToShortNamesMapForEntityKind[entityKind];

    if (!entityKindShort) {
      throw new Error(`Invalid entityKind-${entityKind}`);
    }

    return entityKindShort + '_' + entityId;
  }
}

module.exports = new UserActionDetailConstants();
