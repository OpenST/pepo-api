const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  pendingTransactionConstants = require(rootPrefix + '/lib/globalConstant/pendingTransaction');

// Declare variables.
const dbName = databaseConstants.feedDbName;

/**
 * Class for pending transaction model.
 *
 * @class PendingTransaction
 */
class PendingTransaction extends ModelBase {
  /**
   * Constructor for pending transaction model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'pending_transactions';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      ostTxId: dbRow.ost_tx_id,
      fromUserId: dbRow.from_user_id,
      videoId: dbRow.video_id,
      toUserId: dbRow.to_user_id,
      amount: dbRow.amount,
      status: pendingTransactionConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch pending transactions by from user id and to user ids.
   *
   * @param {array} toUserIds: to user ids
   * @param {number} fromUserId: from user id
   *
   * @return {object}
   */
  async fetchPendingTransactionByFromUserIdAndToUserIds(toUserIds, fromUserId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['to_user_id IN (?) AND from_user_id = (?)', toUserIds, fromUserId])
      .fire();

    const response = {};

    for (let index = 0; index < toUserIds.length; index++) {
      response[toUserIds[index]] = [];
    }

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.toUserId].push(formatDbRow);
    }

    return response;
  }

  /**
   * Fetch pending transactions by from user id and video ids.
   *
   * @param {number} videoIds: video ids
   * @param {number} fromUserId: from user id
   *
   * @return {object}
   */
  async fetchPendingTransactionByFromUserIdAndVideoIds(videoIds, fromUserId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ video_id: videoIds, from_user_id: fromUserId })
      .fire();

    const response = {};

    for (let index = 0; index < videoIds.length; index++) {
      response[videoIds[index]] = [];
    }

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId].push(formatDbRow);
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} [params.fromUserId]
   * @param {number} [params.toUserId]
   * @param {number} [params.videoId]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.fromUserId && params.toUserId) {
      const PendingTransactionsByToUserIdsAndFromUserId = require(rootPrefix +
        '/lib/cacheManagement/multi/PendingTransactionsByToUserIdsAndFromUserId');
      promisesArray.push(
        new PendingTransactionsByToUserIdsAndFromUserId({
          fromUserId: params.fromUserId,
          toUserIds: [params.toUserId]
        }).clear()
      );
    }

    if (params.fromUserId && params.videoId) {
      const PendingTransactionsVideoIdsAndFromUserId = require(rootPrefix +
        '/lib/cacheManagement/multi/PendingTransactionsByVideoIdsAndFromUserId.js');
      promisesArray.push(
        new PendingTransactionsVideoIdsAndFromUserId({
          fromUserId: params.fromUserId,
          videoIds: [params.videoId]
        }).clear()
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = PendingTransaction;
