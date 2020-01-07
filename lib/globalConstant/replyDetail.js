const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedEntityKinds = null,
  invertedParentKinds = null,
  invertedStatuses = null,
  longToShortNamesMap = null;

/**
 * Class for reply detail constants.
 *
 * @class ReplyDetail
 */
class ReplyDetail {
  get videoEntityKind() {
    return 'VIDEO';
  }

  get textEntityKind() {
    return 'TEXT';
  }

  get videoParentKind() {
    return 'VIDEO';
  }

  get textParentKind() {
    return 'TEXT';
  }

  get videoReplyKindForEntityFormatter() {
    return 'VIDEO_REPLY';
  }

  get userReplyKindForEntityFormatter() {
    return 'USER_REPLY';
  }

  get pendingStatus() {
    return 'PENDING';
  }

  get activeStatus() {
    return 'ACTIVE';
  }

  get deletedStatus() {
    return 'DELETED';
  }

  get entityKinds() {
    const oThis = this;

    return {
      '1': oThis.videoEntityKind,
      '2': oThis.textEntityKind
    };
  }

  get invertedEntityKinds() {
    const oThis = this;

    invertedEntityKinds = invertedEntityKinds || util.invert(oThis.entityKinds);

    return invertedEntityKinds;
  }

  get parentKinds() {
    const oThis = this;

    return {
      '1': oThis.videoParentKind,
      '2': oThis.textParentKind
    };
  }

  get invertedParentKinds() {
    const oThis = this;

    invertedParentKinds = invertedParentKinds || util.invert(oThis.parentKinds);

    return invertedParentKinds;
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.activeStatus,
      '3': oThis.deletedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get shortToLongNamesMapForCache() {
    return {
      cuid: 'creatorUserId',
      rdi: 'replyDetailsId',
      rvi: 'replyVideoId'
    };
  }

  get longToShortNamesMapForCache() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMapForCache);

    return longToShortNamesMap;
  }
}

module.exports = new ReplyDetail();
