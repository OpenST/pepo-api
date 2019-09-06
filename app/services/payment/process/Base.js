const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feed base.
 *
 * @class ProcessPaymentBase
 */
class ProcessPaymentBase extends ServiceBase {
  /**
   * Constructor for feed base.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {object} params.receipt
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.receipt = JSON.parse(params.receipt);

    oThis.fiatPaymentId = null;
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._insertFiatPayment();

    await oThis._serviceSpecificTasks();

    await bgJob.enqueue(bgJobConstants.validatePaymentReceiptJobTopic, {
      fiatPaymentId: oThis.fiatPaymentId
    });

    return responseHelper.successWithData({ paymentReceipt: JSON.stringify(oThis.receipt) });
  }

  async _insertFiatPayment() {
    const oThis = this,
      receiptId = oThis.getReceiptId(),
      serviceKind = oThis.getServiceKind();

    let fiatPaymentCreateResp = await new FiatPaymentModel()
      .insert({
        from_user_id: oThis.currentUser.id,
        receipt_id: receiptId,
        raw_receipt: JSON.stringify(oThis.receipt),
        kind: fiatPaymentConstants.invertedKinds[fiatPaymentConstants.topUpKind],
        service_kind: fiatPaymentConstants.invertedServiceKinds[serviceKind],
        currency: ostPricePointConstants.invertedQuoteCurrencies[ostPricePointConstants.usdQuoteCurrency],
        status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pendingStatus]
      })
      .fire();

    oThis.fiatPaymentId = fiatPaymentCreateResp.insertId;

    return responseHelper.successWithData({});
  }

  _validateRequestReceipt() {
    throw 'subclass to implement method.';
  }

  getServiceKind() {
    throw 'subclass to implement method.';
  }
}

module.exports = ProcessPaymentBase;
