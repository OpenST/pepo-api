const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  PendingTransactionModel = require(rootPrefix + '/app/models/mysql/PendingTransaction'),
  TokenUserByUserId = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TransactionByOstTxIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByOstTxId'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class to perform ost transaction.
 *
 * @class OstTransactionBase
 */
class OstTransactionBase extends ServiceBase {
  /**
   * Constructor to perform ost transaction.
   *
   * @param {object} params
   * @param {object} params.ost_transaction
   * @param {object} params.current_user
   * @param {object} [params.is_paper_plane]
   * @param {object} [params.meta]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.transaction = params.ost_transaction;
    oThis.userId = params.current_user.id;
    oThis.meta = params.meta || {};

    oThis.ostTxId = oThis.transaction.id;
    oThis.ostTransactionStatus = oThis.transaction.status.toUpperCase();
    oThis.transfersData = oThis.transaction.transfers;
    oThis.fromOstUserId = oThis.transfersData[0].from_user_id;
    oThis.toOstUserId = oThis.transfersData[0].to_user_id;

    oThis.transactionId = null;
    oThis.transactionObj = null;
    oThis.transactionStatus = null;
    oThis.ostTxExternalEntityId = null;
    oThis.transactionExternalEntityId = null;
    oThis.toUserIdsArray = [];
    oThis.amountsArray = [];
    oThis.descriptionId = null;
    oThis.mentionedUserIds = [];
    oThis.tokenData = null;

    oThis.videoId = null;

    oThis.isValidRedemption = null;
    oThis.pepocornAmount = null;
    oThis.productId = null;
    oThis.pepoUsdPricePoint = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._parseMetaProperty();

    await oThis._setStatuses();

    const promisesArray = [oThis._fetchTransaction(), oThis._fetchFromOstUserIdAndValidate()];
    await Promise.all(promisesArray);

    if (oThis.transactionId) {
      // Record was already inserted. Do nothing.
    } else {
      await oThis._insertInTransactionAndAssociatedTables();
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize.
   *
   * @private
   */
  _parseMetaProperty() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set statuses.
   *
   * @sets oThis.transactionStatus
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _setStatuses() {
    const oThis = this;

    if (transactionConstants.notFinalizedOstTransactionStatuses.indexOf(oThis.ostTransactionStatus) > -1) {
      oThis.transactionStatus = transactionConstants.pendingStatus;

      return responseHelper.successWithData({});
    }

    const errorObject = responseHelper.error({
      internal_error_identifier: 'a_s_ost_4',
      api_error_identifier: 'something_went_wrong',
      debug_options: {
        Error: 'Invalid ost transaction status. Only allowed ost status is CREATED or SUBMITTED or MINED.',
        ostTransactionStatus: oThis.ostTransactionStatus
      }
    });
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

    return Promise.reject(errorObject);
  }

  /**
   * Fetch transaction from db.
   *
   * @sets oThis.transactionId, oThis.transactionObj
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTransaction() {
    const oThis = this;

    const transactionCacheResponse = await new TransactionByOstTxIdCache({ ostTxIds: [oThis.ostTxId] }).fetch();

    logger.log('transactionCacheResponse =======', transactionCacheResponse);
    if (transactionCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ost_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            reason: 'Error while fetching data from TransactionByOstTxIdCache',
            ostTxIds: oThis.ostTxId
          }
        })
      );
    }

    if (transactionCacheResponse.data[oThis.ostTxId].id) {
      oThis.transactionId = transactionCacheResponse.data[oThis.ostTxId].id;
      oThis.transactionObj = transactionCacheResponse.data[oThis.ostTxId];
    }
  }

  /**
   * Fetch OST user id.
   *
   * @sets oThis.ostUserId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchFromOstUserIdAndValidate() {
    const oThis = this;

    const userIds = [oThis.userId];

    const tokenUserDetailsResponse = await new TokenUserByUserId({ userIds: userIds }).fetch();
    if (tokenUserDetailsResponse.isFailure()) {
      return Promise.reject(tokenUserDetailsResponse);
    }

    const userIdToOstUserIdHash = {};
    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];
      // Returning only those entries ost user ids whose data is available
      if (tokenUserDetailsResponse.data[userId].ostUserId) {
        userIdToOstUserIdHash[userId] = tokenUserDetailsResponse.data[userId].ostUserId;
      }
    }

    oThis.ostUserId = userIdToOstUserIdHash[oThis.userId];

    if (!oThis.ostUserId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ot_5',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: oThis.userId }
        })
      );
    }

    if (oThis.ostUserId !== oThis.fromOstUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ot_6',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_from_user_id'],
          debug_options: { transfers: oThis.transfersData }
        })
      );
    }
  }

  /**
   * This function is called when transaction is not found in transaction table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTransactionAndAssociatedTables() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Get extra data.
   *
   * @private
   */
  _getExtraData() {
    throw new Error('Sub-class to implement');
  }

  /**
   * This function fetches to user ids and inserts in to user ids array. It also prepares amounts array.
   *
   * @sets oThis.toUserIdsArray, oThis.amountsArray
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchToUserIdsAndAmounts() {
    const oThis = this;

    const toOstUserIdsArray = [];

    // Loop to prepare array of toOstUserIds which will be used to fetch user ids from multi cache.
    for (let index = 0; index < oThis.transfersData.length; index++) {
      toOstUserIdsArray.push(oThis.transfersData[index].to_user_id);
    }

    const tokenUserDataCacheResponse = await new TokenUserByOstUserIdsCache({ ostUserIds: toOstUserIdsArray }).fetch();
    if (tokenUserDataCacheResponse.isFailure()) {
      return Promise.reject(tokenUserDataCacheResponse);
    }

    // A separate for loop is written in order to ensure user ids and amount's index correspond
    // to each other in toUserIdsArray and amountsArray.

    for (let index = 0; index < oThis.transfersData.length; index++) {
      const toOstUserId = oThis.transfersData[index].to_user_id;
      if (tokenUserDataCacheResponse.data[toOstUserId].userId) {
        oThis.toUserIdsArray.push(tokenUserDataCacheResponse.data[toOstUserId].userId);
        oThis.amountsArray.push(oThis.transfersData[index].amount);
      }
    }
  }

  /**
   * This function prepares extra data for transaction external entity and inserts a row in external entities table.
   *
   * @sets oThis.transactionId
   *
   * @returns {Promise<*>}
   * @private
   */
  async _insertTransaction() {
    const oThis = this;

    let isDuplicateIndexViolation = false;

    const insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.userId,
      kind: transactionConstants.invertedKinds[oThis._transactionKind()],
      to_user_id: oThis.toUserIdsArray[0],
      amount: oThis.amountsArray[0],
      extra_data: JSON.stringify(oThis._getExtraData()),
      status: transactionConstants.invertedStatuses[oThis.transactionStatus]
    };

    const insertResponse = await new TransactionModel()
      .insert(insertData)
      .fire()
      .catch(async function(err) {
        if (TransactionModel.isDuplicateIndexViolation(TransactionModel.transactionIdUniqueIndexName, err)) {
          isDuplicateIndexViolation = true;
        } else {
          // Insert failed due to some other reason.
          // Send error email from here.
          const errorObject = responseHelper.error({
            internal_error_identifier: 'a_s_ost_3',
            api_error_identifier: 'something_went_wrong',
            debug_options: { Error: err }
          });
          await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

          return Promise.reject(errorObject);
        }
      });

    if (!isDuplicateIndexViolation) {
      oThis.transactionId = insertResponse.insertId;
      insertData.id = insertResponse.insertId;

      const formattedInsertData = new TransactionModel().formatDbData(insertData);
      await TransactionModel.flushCache(formattedInsertData);
    }

    return { isDuplicateIndexViolation: isDuplicateIndexViolation };
  }

  /**
   * Insert in pending transaction table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInPendingTransactions() {
    const oThis = this;

    const insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.userId,
      video_id: oThis.videoId,
      to_user_id: oThis.toUserIdsArray[0],
      amount: oThis.amountsArray[0],
      status: transactionConstants.invertedStatuses[oThis.transactionStatus]
    };

    const insertResponse = await new PendingTransactionModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;

    const formattedInsertData = new PendingTransactionModel().formatDbData(insertData);
    await PendingTransactionModel.flushCache(formattedInsertData);
  }

  /**
   * This function check if video is present in parameters.
   *
   * @returns {boolean}
   * @private
   */
  _isVideoIdPresent() {
    const oThis = this;

    return !CommonValidators.isVarNullOrUndefined(oThis.videoId);
  }

  /**
   * Get Transaction Kind
   *
   * @returns {Object}
   * @private
   */
  _transactionKind() {
    throw new Error('Unimplemented method _transactionKind for OstTransaction.');
  }
}

module.exports = OstTransactionBase;
