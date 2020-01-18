const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedTopicKinds, invertedStatuses;

class WebhookEvent {
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

  get queuedStatus() {
    return 'QUEUED';
  }

  get inProgressStatus() {
    return 'IN_PROGRESS';
  }

  get completedStatus() {
    return 'COMPLETED';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get completelyFailedStatus() {
    return 'COMPLETELY_FAILED';
  }

  get deletedStatus() {
    return 'DELETED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.queuedStatus,
      '2': oThis.inProgressStatus,
      '3': oThis.completedStatus,
      '4': oThis.failedStatus,
      '5': oThis.completelyFailedStatus,
      '6': oThis.deletedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new WebhookEvent();
