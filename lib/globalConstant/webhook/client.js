const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for client constants.
 *
 * @class Client
 */
class Client {
  // Statuses start.
  get activeStatus() {
    return 'ACTIVE';
  }

  get deletedStatus() {
    return 'DELETED';
  }
  // Statuses end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.deletedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new Client();
