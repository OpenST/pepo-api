const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedTopicKinds, invertedStatuses;

/**
 * Class for webhook event constants.
 *
 * @class WebhookEvent
 */
class WebhookEvent {
  // Topic kinds start.
  get videoContributionTopicKind() {
    return 'video/contribution';
  }

  get videoUpdateTopicKind() {
    return 'video/update';
  }
  // Topic kinds end.

  get topicKinds() {
    const oThis = this;

    return {
      '1': oThis.videoContributionTopicKind,
      '2': oThis.videoUpdateTopicKind
    };
  }

  get invertedTopicKinds() {
    const oThis = this;

    invertedTopicKinds = invertedTopicKinds || util.invert(oThis.topicKinds);

    return invertedTopicKinds;
  }

  get videoUpdateActivityKind() {
    return 'video_update';
  }

  get videoUpdateContributionKind() {
    return 'video_contribution';
  }

  // Statuses start.
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
  // Statuses end.

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

  get maxRetryCount() {
    return 10;
  }

  get maxInternalErrorCount() {
    return 10;
  }

  get nextExecutionTimeFactor() {
    return 2;
  }
}

module.exports = new WebhookEvent();
