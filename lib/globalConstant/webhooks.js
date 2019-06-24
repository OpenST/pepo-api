const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

let invertedOstStatuses;

/**
 * Class for for webhooks.
 *
 * @class
 */
class Webhooks {
  /**
   * Constructor for webhooks.
   *
   * @constructor
   */
  constructor() {}

  get webhookUrl() {
    if (basicHelper.isProduction()) {
      // || basicHelper.isStaging()) {
      return 'https://' + coreConstants.PA_DOMAIN + '/ost-webhook/v2/';
    } else {
      return 'http://' + coreConstants.PA_DOMAIN + '/ost-webhook/v2/';
    }
  }

  get active() {
    return 'active';
  }

  get inactive() {
    return 'inactive';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.inactive,
      '2': oThis.active
    };
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedOstStatuses) {
      return invertedOstStatuses;
    }

    invertedOstStatuses = util.invert(oThis.statuses);

    return invertedOstStatuses;
  }
}

module.exports = new Webhooks();
