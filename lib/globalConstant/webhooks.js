const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

let invertedOstStatuses;

/**
 * Class for webhooks.
 *
 * @class Webhooks
 */
class Webhooks {
  get webhookUrl() {
    if (basicHelper.isDevelopment()) {
      // || basicHelper.isStaging()) {
      return coreConstants.PA_DOMAIN + '/webhooks/ost/v2/';
    }

    return coreConstants.PA_DOMAIN + '/webhooks/ost/v2/';
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

    invertedOstStatuses = invertedOstStatuses || util.invert(oThis.statuses);

    return invertedOstStatuses;
  }
}

module.exports = new Webhooks();
