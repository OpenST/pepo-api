const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

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
    if (basicHelper.isProduction()) {
      return 'pepo_redemption';
    }
    return 'test_pepo_redemption';
  }

  // Channel names end.
}

module.exports = new Slack();
