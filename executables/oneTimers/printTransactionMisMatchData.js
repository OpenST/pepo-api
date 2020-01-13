const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  OstEventModel = require(rootPrefix + '/app/models/mysql/OstEvent'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class printTransactionMisMatchData {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.findAndUpdateMismatchData('%reply_on_video%', transactionConstants.replyOnVideoTransactionKind);
    await oThis.findAndUpdateMismatchData('%pepo_on_reply%', transactionConstants.userTransactionOnReplyKind);
  }

  /**
   * Find and update mismatch data
   *
   * @param wildCardForOstEventModel
   * @param kind
   * @returns {Promise<void>}
   */
  async findAndUpdateMismatchData(wildCardForOstEventModel, kind) {
    const oThis = this;

    let ostEventHash = {},
      failedTransactionIds = [];

    const dbRows = await new OstEventModel()
      .select('*')
      .where(['event_data LIKE ?', wildCardForOstEventModel])
      .fire();

    console.log('The dbRows.length is : ', dbRows.length);

    for (let i = 0; i < dbRows.length; i++) {
      const formatDbRow = new OstEventModel().formatDbData(dbRows[i]);
      let eventData = JSON.parse(formatDbRow.eventData),
        transactionId = eventData.data.transaction.id,
        parsedHash = transactionConstants._parseTransactionMetaDetails(eventData.data.transaction.meta_property);

      ostEventHash[transactionId] = { replyDetailId: parsedHash.replyDetailId };
    }

    const whereClauseArray = [
      'kind NOT IN (?) AND ost_tx_id IN (?)',
      transactionConstants.invertedKinds[kind],
      Object.keys(ostEventHash)
    ];

    const dbRowsOfTransactionModel = await new TransactionModel()
      .select('*')
      .where(whereClauseArray)
      .fire();

    console.log('The dbRowsOfTransactionModel.length is : ', dbRowsOfTransactionModel.length);

    for (let i = 0; i < dbRowsOfTransactionModel.length; i++) {
      const formatDbRow = new TransactionModel().formatDbData(dbRowsOfTransactionModel[i]);
      let extraData = formatDbRow.extraData,
        transactionId = formatDbRow.ostTxId,
        replyDetailId = ostEventHash[transactionId].replyDetailId,
        videoIdOfExtraData = extraData.videoId,
        updatedAt = formatDbRow.updatedAt;

      console.log('The replyDetailId is : ', replyDetailId, transactionId, extraData, updatedAt);

      extraData.replyDetailId = replyDetailId;

      if (!CommonValidator.isVarNullOrUndefined(videoIdOfExtraData)) {
        await new TransactionModel()
          .update(
            [
              'extra_data=?,kind=?',
              JSON.stringify(extraData),
              transactionConstants.invertedKinds[transactionConstants.replyOnVideoTransactionKind]
            ],
            { touch: false }
          )
          .where({
            ost_tx_id: transactionId
          })
          .fire();
      } else {
        failedTransactionIds.push(transactionId);
      }
    }

    console.log(`The failedTransactionIds for ${kind} is : ${failedTransactionIds}`);
  }
}

new printTransactionMisMatchData()
  .perform()
  .then(function() {
    logger.win('All the transaction mis match data is updated!!!.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('All the transaction mis match data is failed to update. Error: ', err);
    process.exit(1);
  });
