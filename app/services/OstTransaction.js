const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  ValidatePepocornTopUp = require(rootPrefix + '/app/services/pepocornTopUp/Validate'),
  PendingTransactionModel = require(rootPrefix + '/app/models/mysql/PendingTransaction'),
  PepocornTransactionModel = require(rootPrefix + '/app/models/mysql/PepocornTransaction'),
  TokenUserByUserId = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  ReplyVideoPostTransaction = require(rootPrefix + '/lib/transaction/ReplyVideoPostTransaction'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  TransactionByOstTxIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByOstTxId'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ReplyDetailsByEntityIdsAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  ostPlatformSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  pepocornTransactionConstants = require(rootPrefix + '/lib/globalConstant/redemption/pepocornTransaction');

//todo-replies:: review tx logic
/**
 * Class to perform ost transaction.
 *
 * @class OstTransaction
 */
class OstTransaction extends ServiceBase {
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

    oThis._validateAndSanitizeParams();

    const setStatusResponse = await oThis._setStatuses();
    if (setStatusResponse.isFailure()) {
      return Promise.reject(setStatusResponse);
    }

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
   * @sets oThis.videoId, oThis.pepocornAmount, oThis.productId, oThis.pepoUsdPricePoint, oThis.replyDetailId
   *
   * @private
   */
  _validateAndSanitizeParams() {
    const oThis = this;

    const parsedMetaProperty = transactionConstants._parseTransactionMetaDetails(oThis.transaction.meta_property);

    if (oThis.userId == 1445) {
      console.log('\n\n--_validateAndSanitizeParams ostTransactions--oThis.meta--------------------', oThis.meta);
      console.log(
        '\n\n--_validateAndSanitizeParams ostTransactions--oThis.transaction--------------------',
        JSON.stringify(oThis.transaction)
      );
      console.log(
        '\n\n--_validateAndSanitizeParams ostTransactions--parsedMetaProperty--------------------',
        parsedMetaProperty
      );
    }
    if (oThis._isUserTransactionKind()) {
      // Did not use the meta property as not sure of all previous builds.
      oThis.videoId = parsedMetaProperty.videoId;
      oThis.replyDetailId = parsedMetaProperty.replyDetailId;
    } else if (oThis._isRedemptionTransactionKind()) {
      oThis.pepocornAmount = parsedMetaProperty.pepocornAmount;
      oThis.productId = parsedMetaProperty.productId;
      oThis.pepoUsdPricePoint = parsedMetaProperty.pepoUsdPricePoint;
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      oThis.replyDetailId = parsedMetaProperty.replyDetailId;
      oThis.videoId = parsedMetaProperty.videoId;
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      oThis.replyDetailId = parsedMetaProperty.replyDetailId;
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_vas_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { transaction: oThis.transaction }
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
    const oThis = this;

    // Insert in external entities, transactions and pending transactions.
    await oThis._validateTransactionData();

    const insertTransactionResponse = await oThis._insertTransaction();
    if (insertTransactionResponse.isDuplicateIndexViolation) {
      await oThis._fetchTransaction();
      if (!oThis.transactionId) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'a_s_ost_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { ostTxId: oThis.ostTxId }
        });
        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

        return Promise.reject(errorObject);
      }
    } else if (oThis._isUserTransactionKind()) {
      await oThis._insertInPendingTransactions();
    } else if (oThis._isRedemptionTransactionKind()) {
      await oThis._insertInPepocornTransactions();
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      await oThis._validateAndUpdateReplyVideoDetails();
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      await oThis._insertInPendingTransactions();
    }
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

    return errorObject;
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
   * Fetch video details and validate.
   *
   * @sets oThis.replyDetailId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoDetailsAndValidate() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      logger.error('Error while fetching video detail data.');

      return Promise.reject(videoDetailsCacheResponse);
    }

    const videoDetail = videoDetailsCacheResponse.data[oThis.videoId];

    if (CommonValidators.validateNonEmptyObject(videoDetail)) {
      return responseHelper.successWithData({});
    }

    const replyDetailsByEntityIdsAndEntityKindCacheRsp = await new ReplyDetailsByEntityIdsAndEntityKindCache({
      entityIds: [oThis.videoId],
      entityKind: replyDetailConstants.videoEntityKind
    }).fetch();

    if (replyDetailsByEntityIdsAndEntityKindCacheRsp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailsByEntityIdsAndEntityKindCacheRsp);
    }

    const replyDetailId = replyDetailsByEntityIdsAndEntityKindCacheRsp.data[oThis.videoId];

    if (CommonValidators.isVarNullOrUndefined(oThis.replyDetailId) || replyDetailId != oThis.replyDetailId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ot_9',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoDetail: videoDetail, replyDetailId: replyDetailId }
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch reply details and validate.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchReplyDetailsAndValidate() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    const replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];

    if (!CommonValidators.validateNonEmptyObject(replyDetail)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ot_9',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_reply_detail_id'],
          debug_options: { replyDetail: replyDetail, replyDetailId: oThis.replyDetailId }
        })
      );
    }

    if (oThis._isPepoOnReplyTransactionKind()) {
      oThis.videoId = replyDetail.entityId;
    }

    if (oThis._isReplyOnVideoTransactionKind() && replyDetail.descriptionId) {
      oThis.descriptionId = replyDetail.descriptionId;
    }
  }

  /**
   * This function validates if the parameters are correct.
   *
   * @sets oThis.isValidRedemption
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateTransactionDataForRedemption() {
    const oThis = this;

    const validateParams = {
      request_timestamp: oThis.transaction.updated_timestamp,
      product_id: oThis.productId,
      pepo_amount_in_wei: oThis.transfersData[0].amount,
      pepocorn_amount: oThis.pepocornAmount,
      pepo_usd_price_point: oThis.pepoUsdPricePoint
    };

    oThis.isValidRedemption = false;

    const pepocornTopUpValidationResponse = await new ValidatePepocornTopUp(validateParams)
      .perform()
      .catch(async function(err) {
        await createErrorLogsEntry.perform(err, errorLogsConstants.highSeverity);
      });

    if (pepocornTopUpValidationResponse.isFailure()) {
      await createErrorLogsEntry.perform(pepocornTopUpValidationResponse, errorLogsConstants.highSeverity);
    } else {
      oThis.isValidRedemption = true;
    }
  }

  /**
   * Validate if the transaction is valid or not.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateIfValidTransaction() {
    const oThis = this;

    //todo-replies: validate amount?
    const transactionValidationResponse = await ostPlatformSdkWrapper.getTransaction({
      transaction_id: oThis.ostTxId,
      user_id: oThis.fromOstUserId
    });
    if (transactionValidationResponse.isFailure()) {
      return Promise.reject(transactionValidationResponse);
    }

    const transactionObject = transactionValidationResponse.data;
    if (
      !CommonValidators.validateNonEmptyObject(transactionObject) ||
      transactionObject.transaction.id !== oThis.ostTxId
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ot_8',
          api_error_identifier: 'something_went_wrong',
          debug_options: { transactionId: oThis.ostTxId }
        })
      );
    }
  }

  /**
   * Validate reply video details and update necessary tables if validations pass.
   *
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndUpdateReplyVideoDetails() {
    const oThis = this;

    if (oThis.descriptionId) {
      await oThis._fetchMentionedUsers();
    }

    console.log('------oThis.ostTxId-----', oThis.ostTxId);

    const replyVideoResponse = await new ReplyVideoPostTransaction({
      currentUserId: oThis.userId,
      replyDetailId: oThis.replyDetailId,
      videoId: oThis.videoId,
      transactionId: oThis.ostTxId,
      pepoAmountInWei: oThis.transfersData[0].amount,
      mentionedUserIds: oThis.mentionedUserIds
    }).perform();

    if (replyVideoResponse.isFailure()) {
      return Promise.reject(replyVideoResponse);
    }
  }

  /**
   * Fetch mentioned users for given text/description.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchMentionedUsers() {
    const oThis = this;

    const cacheRsp = await new TextIncludesByIdsCache({ ids: [oThis.descriptionId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const textIncludes = cacheRsp.data;

    for (const textId in textIncludes) {
      const includesForAllKinds = textIncludes[textId];

      for (let ind = 0; ind < includesForAllKinds.length; ind++) {
        const includeRow = includesForAllKinds[ind],
          entity = includeRow.entityIdentifier.split('_');

        if (entity[0] === textIncludeConstants.userEntityKindShort) {
          oThis.mentionedUserIds.push(entity[1]);
        }
      }
    }
  }

  /**
   * This function inserts data in external entities table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateTransactionData() {
    const oThis = this;

    const promiseArray = [];

    if (oThis._isUserTransactionKind()) {
      if (oThis._isVideoIdPresent()) {
        promiseArray.push(oThis._fetchVideoDetailsAndValidate());
      }
      promiseArray.push(oThis._fetchToUserIdsAndAmounts());
    } else if (oThis._isRedemptionTransactionKind()) {
      promiseArray.push(oThis._validateToUserIdForRedemption());
      promiseArray.push(oThis._validateTransactionDataForRedemption());
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      //todo-replies: check if toUserId is valid
      promiseArray.push(oThis._fetchReplyDetailsAndValidate(), oThis._validateIfValidTransaction());
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      promiseArray.push(oThis._fetchReplyDetailsAndValidate(), oThis._fetchToUserIdsAndAmounts());
    }

    await Promise.all(promiseArray);
  }

  /**
   * This function validates to user ids and inserts in to user ids array. It also prepares amounts array.
   *
   * @sets oThis.toUserIdsArray, oThis.amountsArray
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateToUserIdForRedemption() {
    const oThis = this;

    if (oThis.transfersData.length !== 1) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_ost_vtui_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { transfersData: oThis.transfersData }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    await oThis.getTokenData();

    if (oThis.transfersData[0].to_user_id.toLowerCase() !== oThis.tokenData.ostCompanyUserId.toLowerCase()) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_ost_vtui_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { transfersData: oThis.transfersData }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    oThis.toUserIdsArray.push(0);
    oThis.amountsArray.push(oThis.transfersData[0].amount);
  }

  /**
   * Get token data.
   *
   * @sets oThis.tokenData
   *
   * @returns {Promise<*|result>}
   */
  async getTokenData() {
    const oThis = this;

    const tokenDataRsp = await new SecureTokenCache().fetch();
    if (tokenDataRsp.isFailure()) {
      logger.error('Error while fetching token data.');

      return Promise.reject(tokenDataRsp);
    }

    oThis.tokenData = tokenDataRsp.data;
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

    /*
    A separate for loop is written in order to ensure user ids and amount's index correspond
    to each other in toUserIdsArray and amountsArray.
     */
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

    const extraData = {
      toUserIds: oThis.toUserIdsArray,
      amounts: oThis.amountsArray,
      kind: oThis._transactionKind()
    };

    if (oThis._isReplyOnVideoTransactionKind() || oThis._isPepoOnReplyTransactionKind()) {
      extraData.replyDetailId = oThis.replyDetailId;
    }

    const insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.userId,
      video_id: oThis.videoId,
      extra_data: JSON.stringify(extraData),
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
    if (oThis.userId == 1445) {
      console.log('--formattedInsertData For pending tx table---', formattedInsertData);
    }
    await PendingTransactionModel.flushCache(formattedInsertData);
  }

  /**
   * Insert in pending transaction table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInPepocornTransactions() {
    const oThis = this;

    const status = oThis.isValidRedemption
      ? pepocornTransactionConstants.processingStatus
      : pepocornTransactionConstants.failedStatus;

    const insertData = {
      user_id: oThis.userId,
      kind: pepocornTransactionConstants.invertedKinds[pepocornTransactionConstants.creditKind],
      pepocorn_amount: oThis.pepocornAmount,
      transaction_id: oThis.transactionId,
      status: pepocornTransactionConstants.invertedStatuses[status]
    };

    const insertResponse = await new PepocornTransactionModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;

    const formattedInsertData = new PepocornTransactionModel().formatDbData(insertData);
    await PepocornTransactionModel.flushCache(formattedInsertData);
  }

  /**
   * Return true if it is a user-to-user transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isUserTransactionKind() {
    const oThis = this;

    return (
      !oThis._isRedemptionTransactionKind() &&
      !oThis._isReplyOnVideoTransactionKind() &&
      !oThis._isPepoOnReplyTransactionKind()
    );
  }

  /**
   * Return true if it is a pepocorn convert for redemption transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isRedemptionTransactionKind() {
    const oThis = this;

    return oThis.transaction.meta_property.name === transactionConstants.redemptionMetaName;
  }

  /**
   * Return true if it is reply on video transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isReplyOnVideoTransactionKind() {
    const oThis = this;

    return oThis.transaction.meta_property.name === transactionConstants.replyOnVideoMetaName;
  }

  /**
   * Return true if it is user-to-user transaction on a reply video.
   *
   * @returns {boolean}
   * @private
   */
  _isPepoOnReplyTransactionKind() {
    const oThis = this;

    return oThis.transaction.meta_property.name === transactionConstants.pepoOnReplyMetaName;
  }

  /**
   * Return transaction kind.
   *
   * @returns {boolean}
   * @private
   */
  _transactionKind() {
    const oThis = this;

    if (oThis._isUserTransactionKind()) {
      return transactionConstants.extraData.userTransactionKind;
    } else if (oThis._isRedemptionTransactionKind()) {
      return transactionConstants.extraData.redemptionKind;
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      return transactionConstants.extraData.replyOnVideoTransactionKind;
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      return transactionConstants.extraData.userTransactionOnReplyKind;
    }
  }
}

module.exports = OstTransaction;
