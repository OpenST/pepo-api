const rootPrefix = '../../..',
  kms = require(rootPrefix + '/lib/globalConstant/kms'),
  util = require(rootPrefix + '/lib/util');

let invertedApiVersions, invertedStatuses;

/**
 * Class for webhook endpoint constants.
 *
 * @class WebhookEndpoint
 */
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

  // Statuses start.
  get activeStatus() {
    return 'ACTIVE';
  }

  // Statuses start.
  get inActiveStatus() {
    return 'IN_ACTIVE';
  }

  get deletedStatus() {
    return 'DELETED';
  }
  // Statuses end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inActiveStatus,
      '3': oThis.deletedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get encryptionSecretPurpose() {
    return kms.webhookSecretEncryptionPurpose;
  }
}

module.exports = new WebhookEndpoint();
