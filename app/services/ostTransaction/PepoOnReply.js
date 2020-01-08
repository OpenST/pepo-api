const rootPrefix = '../../..',
  OstTransactionBase = require(rootPrefix + '/app/services/ostTransaction/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class to perform ost transaction.
 *
 * @class PepoOnReplyTransaction
 */
class PepoOnReplyTransaction extends OstTransactionBase {
  /**
   * Constructor to perform ost transaction.
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.replyDetailId
   *
   * @private
   */
  _parseMetaProperty() {
    const oThis = this;

    const parsedMetaProperty = transactionConstants._parseTransactionMetaDetails(oThis.transaction.meta_property);
    oThis.replyDetailId = parsedMetaProperty.replyDetailId;
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
    } else {
      await oThis._insertInPendingTransactions();
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
    promiseArray.push(oThis._fetchReplyDetailsAndValidate(), oThis._fetchToUserIdsAndAmounts());
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
          internal_error_identifier: 'a_s_ot_9',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_reply_detail_id'],
          debug_options: { replyDetail: replyDetail, replyDetailId: oThis.replyDetailId }
        })
      );
    }

    oThis.videoId = replyDetail.entityId;
  }

  /**
   * Get extra data.
   *
   * @returns {Object}
   * @private
   */
  _getExtraData() {
    const oThis = this;

    return { replyDetailId: oThis.replyDetailId };
  }

  /**
   * Get Transaction Kind
   *
   * @returns {Object}
   * @private
   */
  _transactionKind() {
    const oThis = this;

    return transactionConstants.userTransactionOnReplyKind;
  }
}

module.exports = PepoOnReplyTransaction;
