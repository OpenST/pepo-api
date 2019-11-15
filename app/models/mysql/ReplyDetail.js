const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
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
   * @param {string} dbRow.link_ids
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
      entityKind: replyDetailConstants.entityKinds[dbRow.entity_kind],
      entityId: dbRow.entity_id,
      parentKind: replyDetailConstants.parentKinds[dbRow.parent_kind],
      parentId: dbRow.parent_id,
      descriptionId: dbRow.description_id,
      linkIds: dbRow.link_ids ? JSON.parse(dbRow.link_ids) : null,
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
      'entityKind',
      'entityId',
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
   * Fetch by video id.
   *
   * @param {integer} params.limit: no of rows to fetch
   * @param {integer} params.videoId: video id
   * @param {integer} params.paginationTimestamp: pagination timestamp
   *
   * @returns Promise{object}
   */
  async fetchByVideoId(params) {
    const oThis = this;

    const limit = params.limit,
      videoId = params.videoId,
      paginationTimestamp = params.paginationTimestamp;

    const queryObject = oThis
      .select('*')
      .where({
        parent_id: videoId,
        entity_kind: replyDetailConstants.invertedEntityKinds[replyDetailConstants.videoEntityKind],
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus]
      })
      .order_by('id desc')
      .limit(limit);

    if (paginationTimestamp) {
      queryObject.where(['created_at < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    const replyDetails = {};
    const replyIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      replyDetails[formatDbRow.id] = formatDbRow;
      replyIds.push(formatDbRow.id);
    }

    return { replyDetails: replyDetails, replyIds: replyIds };
  }

  /**
   * Fetch reply detail by entity id and entity kind.
   *
   * @param params
   * @returns {Promise<*>}
   */
  async fetchReplyDetailByEntityIdsAndEntityKind(params) {
    const oThis = this;

    const entityIds = params.entityIds,
      entityKind = params.entityKind;

    const dbRows = await oThis
      .select('*')
      .where({
        entity_id: entityIds,
        entity_kind: replyDetailConstants.invertedEntityKinds[entityKind]
      })
      .fire();

    const replyDetails = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      replyDetails[formatDbRow.entityId] = formatDbRow;
    }

    return replyDetails;
  }

  /**
   * Fetch reply details by ids.
   *
   * @param {array} replyDetailIds
   *
   * @returns {Promise<void>}
   */
  async fetchByIds(replyDetailIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ id: replyDetailIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert new video.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {string} params.entityKind
   * @param {number} params.entityId
   * @param {string} params.parentKind
   * @param {number} params.parentId
   * @param {string} [params.linkIds]
   * @param {string} params.status
   *
   * @returns Promise{object}
   */
  async insertVideo(params) {
    const oThis = this;

    let linkIds = null;

    if (params.linkIds && params.linkIds.length > 0) {
      linkIds = JSON.stringify(params.linkIds);
    }

    const insertResponse = await oThis
      .insert({
        creator_user_id: params.userId,
        entity_kind: replyDetailConstants.invertedEntityKinds[params.entityKind],
        entity_id: params.entityId,
        parent_kind: replyDetailConstants.invertedParentKinds[params.parentKind],
        parent_id: params.parentId,
        link_ids: linkIds,
        status: replyDetailConstants.invertedStatuses[params.status]
      })
      .fire();

    const flushCacheParams = {
      parentVideoIds: [params.parentId],
      entityIds: [params.entityId],
      entityKind: params.entityKind
    };

    await ReplyDetail.flushCache(flushCacheParams);

    logger.log('insertResponse  ============', insertResponse);
    return insertResponse;
  }

  /**
   * Mark video entities deleted.
   *
   * @param {object} params
   * @param {Array} params.replyDetailsIds
   *
   * @returns {object}
   */
  async markReplyDetailsDeleted(params) {
    const oThis = this;

    const updateResp = await oThis
      .update({
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.deletedStatus]
      })
      .where({ id: params.replyDetailsIds })
      .where(['status != ?', replyDetailConstants.invertedStatuses[replyDetailConstants.deletedStatus]])
      .fire();

    return updateResp.affectedRows;
  }

  /**
   * Update by reply detail id.
   *
   * @param {object} params
   * @param {number} params.totalAmount
   * @param {number} params.totalContributedBy
   * @param {number} params.replyDetailId
   *
   * @returns {Promise<void>}
   */
  async updateByReplyDetailId(params) {
    const oThis = this;

    const ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds');

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [params.replyDetailId] }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    const replyDetail = replyDetailCacheResp.data[params.replyDetailId];

    const totalTransactions = 1;

    const updateResponse = await oThis
      .update([
        'total_amount = total_amount + ?, total_transactions = total_transactions + ?, ' +
          'total_contributed_by = total_contributed_by + ? ',
        params.totalAmount,
        totalTransactions,
        params.totalContributedBy
      ])
      .where({ id: replyDetail.id })
      .fire();

    const flushCacheParams = {
      parentVideoIds: [replyDetail.parentId],
      replyDetailId: replyDetail.id,
      entityIds: [replyDetail.entityId],
      entityKind: replyDetailConstants.videoEntityKind
    };

    await ReplyDetail.flushCache(flushCacheParams);

    return updateResponse;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} [params.parentVideoIds]
   * @param {number} [params.replyDetailId]
   * @param {array<number>} [params.replyDetailIds]
   * @param {array<number>} [params.entityIds]
   * @param {string} [params.entityKind]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.parentVideoIds) {
      const ReplyDetailsByParentVideoPaginationCache = require(rootPrefix +
        '/lib/cacheManagement/single/ReplyDetailsByParentVideoPagination');

      for (let index = 0; index < params.parentVideoIds.length; index++) {
        promisesArray.push(
          new ReplyDetailsByParentVideoPaginationCache({ videoId: params.parentVideoIds[index] }).clear()
        );
      }
    }

    if (params.replyDetailId) {
      const ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds');

      promisesArray.push(new ReplyDetailsByIdsCache({ ids: [params.replyDetailId] }).clear());
    }

    if (params.replyDetailIds) {
      const ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds');

      promisesArray.push(new ReplyDetailsByIdsCache({ ids: params.replyDetailIds }).clear());
    }

    if (params.entityIds && params.entityKind) {
      const ReplyDetailsByEntityIdsAndEntityKindCache = require(rootPrefix +
        '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind');

      promisesArray.push(
        new ReplyDetailsByEntityIdsAndEntityKindCache({
          entityIds: params.entityIds,
          entityKind: params.entityKind
        }).clear()
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = ReplyDetail;
