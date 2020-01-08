const rootPrefix = '../../..',
  OstTransactionBase = require(rootPrefix + '/app/services/ostTransaction/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class to perform ost transaction.
 *
 * @class UserTransaction
 */
class UserTransaction extends OstTransactionBase {
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
    super(params);
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.videoId
   *
   * @private
   */
  _parseMetaProperty() {
    const oThis = this;

    const parsedMetaProperty = transactionConstants._parseTransactionMetaDetails(oThis.transaction.meta_property);

    // Did not use the meta property as not sure of all previous builds.
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

    if (oThis._isVideoIdPresent()) {
      promiseArray.push(oThis._fetchVideoDetailsAndValidate());
    }
    promiseArray.push(oThis._fetchToUserIdsAndAmounts());

    await Promise.all(promiseArray);
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

    // Que: Y validate?
  }

  /**
   * Get extra data.
   *
   * @returns {Object}
   * @private
   */
  _getExtraData() {
    const oThis = this;

    const ed = {
      toUserIds: oThis.toUserIdsArray,
      amounts: oThis.amountsArray,
      kind: transactionConstants.extraData.userTransactionKind
    };

    if (oThis._isVideoIdPresent()) {
      ed['videoId'] = oThis.videoId;
    }

    return ed;
  }

  /**
   * Get Transaction Kind
   *
   * @returns {Object}
   * @private
   */
  _transactionKind() {
    const oThis = this;

    return transactionConstants.userTransactionKind;
  }
}

module.exports = UserTransaction;
