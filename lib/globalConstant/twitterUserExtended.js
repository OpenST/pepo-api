const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedAccessTypes;

/**
 * Class for twitter user extended constants.
 *
 * @class TwitterUserExtendedConstants
 */
class TwitterUserExtendedConstants {
  get activeStatus() {
    return 'ACTIVE';
  }

  get expiredStatus() {
    return 'EXPIRED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.expiredStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get noneAccessType() {
    return 'none';
  }

  get readAccessType() {
    return 'read';
  }

  get writeAccessType() {
    return 'write';
  }

  get accessTypes() {
    const oThis = this;

    return {
      '0': oThis.noneAccessType,
      '1': oThis.readAccessType,
      '2': oThis.writeAccessType
    };
  }

  get invertedAccessTypes() {
    const oThis = this;

    invertedAccessTypes = invertedAccessTypes || util.invert(oThis.accessTypes);

    return invertedAccessTypes;
  }

  get twitterAccessTypeHeader() {
    return 'x-access-level';
  }

  getAccessLevelFromTwitterHeader(headers) {
    const oThis = this;

    const twitterAccessLevel = headers[oThis.twitterAccessTypeHeader];

    switch (twitterAccessLevel) {
      case 'read-write': {
        return oThis.writeAccessType;
      }
      case 'read': {
        return oThis.readAccessType;
      }
      default: {
        throw new Error(`Unrecognized twitterAccessLevel: ${twitterAccessLevel}`);
      }
    }
  }
}

module.exports = new TwitterUserExtendedConstants();
