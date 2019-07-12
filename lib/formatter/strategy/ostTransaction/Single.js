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
      ostTxId: { isNullAllowed: false },
      fromUserId: { isNullAllowed: false },
      videoId: { isNullAllowed: true },
      status: { isNullAllowed: false },
      extraData: { isNullAllowed: false }
    };

    const ostTransactionValidationResponse = oThis._validateParameters(oThis.ostTransaction, ostTransactionKeyConfig);

    if (ostTransactionValidationResponse.isFailure()) {
      return ostTransactionValidationResponse;
    }

    const ostTransactionExtraDataKeyConfig = {
      toUserIds: { isNullAllowed: false },
      amounts: { isNullAllowed: false }
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
      ost_id: oThis.ostTransaction.ostTxId,
      video_id: oThis.ostTransaction.videoId,
      from_user_id: oThis.ostTransaction.fromUserId,
      to_user_ids: extraData.toUserIds,
      amounts: extraData.amounts,
      status: oThis.ostTransaction.status.toUpperCase()
    });
  }
}

module.exports = OstTransactionSingleFormatter;
