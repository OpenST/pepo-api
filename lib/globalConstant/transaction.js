const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds;

/**
 * Class for transaction constants.
 *
 * @class TransactionConstants
 */
class TransactionConstants {
  get pendingStatus() {
    return 'PENDING';
  }

  get doneStatus() {
    return 'DONE';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.doneStatus,
      '3': oThis.failedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get failedOstTransactionStatus() {
    return 'FAILED';
  }

  get successOstTransactionStatus() {
    return 'SUCCESS';
  }

  get notFinalizedOstTransactionStatuses() {
    return ['CREATED', 'SUBMITTED', 'MINED'];
  }

  get redemptionMetaName() {
    return 'redemption';
  }

  get referralBonusMetaName() {
    return 'referral_bonus';
  }

  get replyOnVideoMetaName() {
    return 'reply_on_video';
  }

  get pepoOnReplyMetaName() {
    return 'pepo_on_reply';
  }

  get userActivateAirdropMetaName() {
    return 'UserActivateAirdrop';
  }

  get topUpMetaName() {
    return 'TOP_UP';
  }

  get airdropKind() {
    return 'AIRDROP';
  }

  get redemptionKind() {
    return 'REDEMPTION';
  }

  get userTransactionKind() {
    return 'USER_TRANSACTION';
  }

  get topUpKind() {
    return 'TOP_UP';
  }

  get replyOnVideoTransactionKind() {
    return 'REPLY_ON_VIDEO';
  }

  get userTransactionOnReplyKind() {
    return 'USER_TRANSACTION_REPLY';
  }

  get bonusTransactionKind() {
    return 'BONUS_TRANSACTION';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.airdropKind,
      '2': oThis.redemptionKind,
      '3': oThis.userTransactionKind,
      '4': oThis.topUpKind,
      '5': oThis.replyOnVideoTransactionKind,
      '6': oThis.userTransactionOnReplyKind,
      '7': oThis.bonusTransactionKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  _parseTransactionMetaDetails(metaProperty) {
    const oThis = this;

    const parsedHash = {};
    if (!metaProperty.details) {
      return parsedHash;
    }

    const detailsStringArray = metaProperty.details.split(' ');

    for (let index = 0; index < detailsStringArray.length; index++) {
      const detailsKeyValueArray = detailsStringArray[index].split('_');
      const longNameKey = oThis.shortToLongName[detailsKeyValueArray[0]];
      if (longNameKey) {
        parsedHash[longNameKey] = detailsKeyValueArray[1];
      }
    }

    return parsedHash;
  }

  get shortToLongName() {
    return {
      vi: 'videoId',
      ipp: 'isPaperPlane',
      pid: 'productId',
      pupp: 'pepoUsdPricePoint',
      pca: 'pepocornAmount',
      rdi: 'replyDetailId'
    };
  }
}

module.exports = new TransactionConstants();
