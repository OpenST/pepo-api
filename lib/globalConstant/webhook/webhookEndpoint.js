const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedApiVersions, invertedStatuses;

class WebhookEndpoint {
  get versionOne() {
    return 'v1';
  }

  get apiVersions() {
    const oThis = this;

    return {
      '1': oThis.versionOne
    };
  }

  get invertedApiVersions() {
    const oThis = this;

    invertedApiVersions = invertedApiVersions || util.invert(oThis.apiVersions);

    return invertedApiVersions;
  }

  // Status Start

  get activeStatus() {
    return 'ACTIVE';
  }

  get deletedStatus() {
    return 'DELETED';
  }

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

module.exports = new WebhookEndpoint();
