const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for Session Auth Payload constants.
 *
 * @class SessionAuthPayloadConstant
 */
class SessionAuthPayloadConstant {
  // Status enum types start
  get activeStatus() {
    return 'ACTIVE';
  }
  // Status enum types end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new SessionAuthPayloadConstant();
