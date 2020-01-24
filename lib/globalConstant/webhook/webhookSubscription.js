const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedTopicKinds, invertedStatuses;

/**
 * Class for webhook subscription constants.
 *
 * @class WebhookSubscription
 */
class WebhookSubscription {
  // Topic kinds start.
  get tagVideoTopicKind() {
    return 'tag/video';
  }
  // Topic kinds end.

  get topicKinds() {
    const oThis = this;

    return {
      '1': oThis.tagVideoTopicKind
    };
  }

  get invertedTopicKinds() {
    const oThis = this;

    invertedTopicKinds = invertedTopicKinds || util.invert(oThis.topicKinds);

    return invertedTopicKinds;
  }

  // Statuses start.
  get activeStatus() {
    return 'ACTIVE';
  }

  get deletedStatus() {
    return 'DELETED';
  }
  // Statuses end.

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

module.exports = new WebhookSubscription();
