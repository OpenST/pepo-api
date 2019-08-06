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
  get created() {
    return 'CREATED';
  }

  get connected() {
    return 'CONNECTED';
  }

  get expired() {
    return 'EXPIRED';
  }
  // Statuses end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.created,
      '2': oThis.connected,
      '3': oThis.expired
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

  getSocketRmqTopic(cron_processes_id) {
    return 'socket.connections.' + cron_processes_id;
  }
}

module.exports = new SocketConnection();
