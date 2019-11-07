const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for reply detail model.
 *
 * @class ReplyDetail
 */
class ReplyDetail extends ModelBase {
  /**
   * Constructor for reply detail model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'reply_details';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.creator_user_id
   * @param {number} dbRow.entity_id
   * @param {number} dbRow.entity_kind
   * @param {number} dbRow.parent_kind
   * @param {number} dbRow.parent_id
   * @param {number} dbRow.description_id
   * @param {array} dbRow.link_ids
   * @param {number} dbRow.transaction_id
   * @param {number} dbRow.total_contributed_by
   * @param {number} dbRow.total_amount
   * @param {number} dbRow.total_transactions
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      creatorUserId: dbRow.creator_user_id,
      entityId: dbRow.entity_id,
      entityKind: replyDetailConstants.entityKinds[dbRow.entity_kind],
      parentKind: replyDetailConstants.parentKinds[dbRow.parent_kind],
      parentId: dbRow.parent_id,
      descriptionId: dbRow.description_id,
      linkIds: dbRow.link_ids,
      transactionId: dbRow.transaction_id,
      totalContributedBy: dbRow.total_contributed_by,
      totalAmount: dbRow.total_amount,
      totalTransactions: dbRow.total_transactions,
      status: replyDetailConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'creatorUserId',
      'entityId',
      'entityKind',
      'parentKind',
      'parentId',
      'descriptionId',
      'linkIds',
      'transactionId',
      'totalContributedBy',
      'totalAmount',
      'totalTransactions',
      'status',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = ReplyDetail;
