/**
 * Class for slack constants.
 *
 * @class
 */
class Slack {
  /**
   * Constructor for slack constants.
   *
   * @constructor
   */
  constructor() {}

  // Channel names start.
  get redemptionRequestChannelName() {
    return 'redemption-request';
  }

  // Channel names end.
}

module.exports = new Slack();
