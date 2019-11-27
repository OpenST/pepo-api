const BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  OstTransactionBase = require(rootPrefix + '/app/services/ostTransaction/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserByUserId = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  ReplyVideoPostTransaction = require(rootPrefix + '/lib/transaction/ReplyVideoPostTransaction'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  ostPlatformSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude');

/**
 * Class to ReplyOnVideoTransaction.
 *
 * @class ReplyOnVideoTransaction
 */
class ReplyOnVideoTransaction extends OstTransactionBase {
  /**
   * Constructor to perform ost transaction.
   *
   * @param {object} params
   *
   * @augments OstTransactionBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.videoId, oThis.replyDetailId
   *
   * @private
   */
  _parseMetaProperty() {
    const oThis = this;

    const parsedMetaProperty = transactionConstants._parseTransactionMetaDetails(oThis.transaction.meta_property);

    logger.log('parsedMetaProperty =====', parsedMetaProperty);
    oThis.replyDetailId = parsedMetaProperty.replyDetailId;
    oThis.videoId = parsedMetaProperty.videoId;
  }

  /**
   * This function is called when transaction is not found in transaction table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTransactionAndAssociatedTables() {
    const oThis = this;

    await oThis._validateTransactionData();

    const insertTransactionResponse = await oThis._insertTransaction();
    if (insertTransactionResponse.isDuplicateIndexViolation) {
      await oThis._fetchTransaction();
      if (!oThis.transactionId) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'a_s_ost_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { ostTxId: oThis.ostTxId }
        });
        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

        return Promise.reject(errorObject);
      }
    } else {
      await oThis._validateAndUpdateReplyVideoDetails();
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

    promiseArray.push(oThis._fetchReplyDetailsAndValidate(), oThis._validateIfValidTransaction());

    await Promise.all(promiseArray);
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
          internal_error_identifier: 'a_s_ot_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_reply_detail_id'],
          debug_options: { replyDetail: replyDetail, replyDetailId: oThis.replyDetailId }
        })
      );
    }

    if (replyDetail.status !== replyDetailConstants.pendingStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ot_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_reply_detail_id'],
          debug_options: { replyDetail: replyDetail, replyDetailId: oThis.replyDetailId }
        })
      );
    }

    if (replyDetail.descriptionId) {
      oThis.descriptionId = replyDetail.descriptionId;

      // Validate to user id.
      if (replyDetail.parentKind === replyDetailConstants.videoParentKind) {
        const parentVideoId = replyDetail.parentId;

        const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [parentVideoId] }).fetch();

        if (videoDetailsCacheResponse.isFailure()) {
          logger.error('Error while fetching video detail data.');

          return Promise.reject(videoDetailsCacheResponse);
        }

        const videoDetail = videoDetailsCacheResponse.data[parentVideoId],
          parentVideoCreatorUserId = videoDetail.creatorUserId,
          parentVideoPerReplyAmountInWei = videoDetail.perReplyAmountInWei;

        const parentVideoPerReplyAmountInWeiBN = new BigNumber(parentVideoPerReplyAmountInWei),
          transferAmountBN = new BigNumber(oThis.transfersData[0].amount);

        if (!parentVideoPerReplyAmountInWeiBN.eq(transferAmountBN)) {
          return Promise.reject(
            responseHelper.paramValidationError({
              internal_error_identifier: 'a_s_ot_4',
              api_error_identifier: 'invalid_api_params',
              params_error_identifiers: ['invalid_amount_in_transaction'],
              debug_options: {
                parentVideoPerReplyAmountInWei: parentVideoPerReplyAmountInWei,
                transferAmount: oThis.transfersData[0].amount
              }
            })
          );
        }

        const tokenUserDetailsResponse = await new TokenUserByUserId({ userIds: [parentVideoCreatorUserId] }).fetch();
        if (tokenUserDetailsResponse.isFailure()) {
          return Promise.reject(tokenUserDetailsResponse);
        }

        const tokenUserDetail = tokenUserDetailsResponse.data[parentVideoCreatorUserId],
          parentUserOstUserId = tokenUserDetail.ostUserId;

        if (parentUserOstUserId !== oThis.toOstUserId) {
          return Promise.reject(
            responseHelper.paramValidationError({
              internal_error_identifier: 'a_s_ot_5',
              api_error_identifier: 'invalid_api_params',
              params_error_identifiers: ['invalid_to_user_id'],
              debug_options: { transfers: oThis.transfersData }
            })
          );
        }

        oThis.toUserIdsArray.push(parentVideoCreatorUserId);
        oThis.amountsArray.push(oThis.transfersData[0].amount);
      } else {
        throw new Error('Invalid parentKind: ' + replyDetail.parentKind);
      }
    }
  }

  /**
   * Fetch transaction from OST.
   *
   * @returns {Promise<never>}
   */
  async fetchTransactionFromOST() {
    const oThis = this;

    const transactionValidationResponse = await ostPlatformSdkWrapper.getTransaction({
      transaction_id: oThis.ostTxId,
      user_id: oThis.fromOstUserId
    });
    if (transactionValidationResponse.isFailure()) {
      return Promise.reject(transactionValidationResponse);
    }

    return transactionValidationResponse.data;
  }

  /**
   * Validate if the transaction is valid or not.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateIfValidTransaction() {
    const oThis = this;

    const transactionObject = await oThis.fetchTransactionFromOST();
    if (!CommonValidators.validateNonEmptyObject(transactionObject)) {
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

    const replyVideoResponse = await new ReplyVideoPostTransaction({
      currentUserId: oThis.userId,
      replyDetailId: oThis.replyDetailId,
      videoId: oThis.videoId,
      transactionId: oThis.transactionId,
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
   * Get extra data.
   *
   * @returns {Object}
   * @private
   */
  _getExtraData() {
    const oThis = this;

    return {
      toUserIds: oThis.toUserIdsArray,
      amounts: oThis.amountsArray,
      kind: transactionConstants.extraData.replyOnVideoTransactionKind,
      replyDetailId: oThis.replyDetailId
    };
  }
}

module.exports = ReplyOnVideoTransaction;
