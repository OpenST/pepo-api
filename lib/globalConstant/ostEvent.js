'use strict';
/**
 * Constants for token_users.
 *
 * @module lib/globalConstant/ostEvent
 */

const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for Ost Events.
 *
 * @class
 */
class OstEvent {
  /**
   * Constructor for Ost Events.
   *
   * @constructor
   */
  constructor() {}

  get pendingStatus() {
    return 'PENDING';
  }

  get startedStatus() {
    return 'STARTED';
  }

  get doneStatus() {
    return 'DONE';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.startedStatus,
      '3': oThis.doneStatus,
      '4': oThis.failedStatus
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

  //ost events topic start

  get usersActivationSuccess() {
    return 'users/activation_success';
  }

  //ost events topic end
}

module.exports = new OstEvent();
