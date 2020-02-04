const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for for user socket connection details constants.
 *
 * @class SocketConnection
 */
class SocketConnection {
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

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  /**
   * Get socket RMQ topic name.
   *
   * @param {string} socketIdentifier
   *
   * @returns {string}
   */
  getSocketRmqTopic(socketIdentifier) {
    return 'socket.' + socketIdentifier;
  }

  /**
   * Get socket identifier from topic.
   *
   * @param {string} topic
   *
   * @returns {string}
   */
  getSocketIdentifierFromTopic(topic) {
    const topicElements = topic.split('.');

    return topicElements[topicElements.length - 1];
  }
}

module.exports = new SocketConnection();
