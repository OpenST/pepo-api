const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for for user socket connection details constants.
 *
 * @class
 */
class SocketConnection {
  /**
   * Constructor for user socket connection constants.
   *
   * @constructor
   */
  constructor() {}

  // Statuses start.
  get createdStatus() {
    return 'CREATED';
  }

  get connectedStatus() {
    return 'CONNECTED';
  }

  get expiredStatus() {
    return 'EXPIRED';
  }
  // Statuses end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.createdStatus,
      '2': oThis.connectedStatus,
      '3': oThis.expiredStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }

  /**
   * Get Socket RMQ Topic name
   *
   * @param cronProcessesId
   * @returns {string}
   */
  getSocketRmqTopic(cronProcessesId) {
    return 'socket.connections.' + cronProcessesId;
  }
}

module.exports = new SocketConnection();
