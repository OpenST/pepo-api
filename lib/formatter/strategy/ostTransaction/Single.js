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

    const ostTransactionValidationResponse = oThis.validateParameters(oThis.ostTransaction, ostTransactionKeyConfig);

    if (ostTransactionValidationResponse.isFailure()) {
      return ostTransactionValidationResponse;
    }

    const ostTransactionExtraDataKeyConfig = {};

    return oThis.validateParameters(oThis.ostTransaction.extraData, ostTransactionExtraDataKeyConfig);
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
      video_id: extraData.videoId,
      from_user_id: oThis.ostTransaction.fromUserId,
      to_user_ids: [oThis.ostTransaction.toUserId],
      amounts: [oThis.ostTransaction.amount],
      status: oThis.ostTransaction.status.toUpperCase()
    });
  }
}

module.exports = OstTransactionSingleFormatter;
