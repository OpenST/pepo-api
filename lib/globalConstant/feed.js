const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds, invertedPrivacyTypes;

/**
 * Class for feed constants
 *
 * @class
 */
class FeedConstants {
  get transactionKind() {
    return 'OST_TRANSACTION';
  }

  get pendingStatus() {
    return 'PENDING';
  }

  get publishedStatus() {
    return 'PUBLISHED';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get publicPrivacyType() {
    return 'PUBLIC';
  }

  get privatePrivacyType() {
    return 'PRIVATE';
  }

  get privacyTypes() {
    const oThis = this;

    return {
      '1': oThis.publicPrivacyType,
      '2': oThis.privatePrivacyType
    };
  }

  get invertedPrivacyTypes() {
    const oThis = this;

    if (invertedPrivacyTypes) {
      return invertedPrivacyTypes;
    }

    invertedPrivacyTypes = util.invert(oThis.privacyTypes);

    return invertedPrivacyTypes;
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.publishedStatus,
      '3': oThis.failedStatus
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

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.transactionKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new FeedConstants();
