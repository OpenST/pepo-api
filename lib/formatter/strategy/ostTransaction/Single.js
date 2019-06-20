const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for POST Transaction formatter.
 *
 * @class OstTransactionSingleFormatter
 */
class OstTransactionSingleFormatter extends BaseFormatter {
  /**
   * Constructor for POST Transaction formatter.
   *
   * @param {object} params
   * @param {object} params.ostTransaction
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.ostTransaction = params.ostTransaction;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const ostTransactionKeyConfig = {
      id: { isNullAllowed: false },
      entityId: { isNullAllowed: false },
      extraData: { isNullAllowed: false }
    };

    const ostTransactionValidationResponse = oThis._validateParameters(oThis.ostTransaction, ostTransactionKeyConfig);

    if (ostTransactionValidationResponse.isFailure()) {
      return ostTransactionValidationResponse;
    }

    const ostTransactionExtraDataKeyConfig = {
      fromUserId: { isNullAllowed: false },
      toUserIds: { isNullAllowed: false },
      amounts: { isNullAllowed: false },
      ostTransactionStatus: { isNullAllowed: false }
      //minedTimestamp: { isNullAllowed: true } // TODO: @Shlok: Uncommect this.
    };

    return oThis._validateParameters(oThis.ostTransaction.extraData, ostTransactionExtraDataKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    const extraData = oThis.ostTransaction.extraData;

    return responseHelper.successWithData({
      id: oThis.ostTransaction.id,
      ost_id: oThis.ostTransaction.entityId,
      from_user_id: extraData.fromUserId,
      to_user_ids: extraData.toUserIds,
      amounts: extraData.amounts,
      status: extraData.ostTransactionStatus.toUpperCase(),
      mined_timestamp: extraData.minedTimestamp
    });
  }
}

module.exports = OstTransactionSingleFormatter;
