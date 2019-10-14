const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

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

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

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

  get extraData() {
    return {
      airdropKind: 'AIRDROP',
      redemptionKind: 'REDEMPTION',
      userTransactionKind: 'USER_TRANSACTION',
      topUpKind: 'TOP_UP'
    };
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
      pca: 'pepocornAmount'
    };
  }
}

module.exports = new TransactionConstants();
