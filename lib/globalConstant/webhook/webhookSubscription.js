const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedTopicKinds, invertedStatuses;

class WebhookSubscription {
  // topic_kinds

  get tagVideoTopicKind() {
    return 'tag/video';
  }

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

module.exports = new WebhookSubscription();
