const BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  pepocornProductConstants = require(rootPrefix + '/lib/globalConstant/pepocornProduct'),
  OstPricePointModel = require(rootPrefix + '/app/models/mysql/OstPricePoints'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to validate pepocorn topup request
 *
 * @class ValidatePepocornTopup
 */
class ValidatePepocornTopup extends ServiceBase {
  /**
   * Constructor to validate pepocorn topup request
   *
   * @param {object} params
   * @param {number} params.product_id
   * @param {number} params.pepo_amount_in_wei
   * @param {number} params.pepocorn_amount
   * @param {number} params.pepo_usd_price_point
   *
   * @param {number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.productId = params.product_id;
    oThis.pepoAmount = params.pepo_amount_in_wei;
    oThis.pepocornAmount = params.pepocorn_amount;
    oThis.pepoUsdPricePoint = params.pepo_usd_price_point;
    oThis.currentUserId = params.current_user ? params.current_user.id : null;

    oThis.pricePoints = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateInput();

    return responseHelper.successWithData({});
  }

  /**
   * Validate input
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateInput() {
    const oThis = this;

    if (oThis.productId != pepocornProductConstants.productId) {
      return Promise.reject(oThis._errorResponse('a_s_ptu_v_1'));
    }

    await oThis._validatePricePoint();

    // Pepocorn amount is not divisible by step factor
    let pepocornAmountBN = new BigNumber(oThis.pepocornAmount),
      stepFactorBN = new BigNumber(pepocornProductConstants.productStepFactor);
    if (!pepocornAmountBN.mod(stepFactorBN).eq(new BigNumber(0))) {
      return Promise.reject(oThis._errorResponse('a_s_ptu_v_3'));
    }

    // Validate number of pepos can be given
    if (!oThis._getPeposForPepocornAmount().eq(new BigNumber(oThis.pepoAmount))) {
      return Promise.reject(oThis._errorResponse('a_s_ptu_v_4'));
    }
  }

  /**
   * Get pepos for pepocorn amount
   *
   * @returns {BigNumber}
   * @private
   */
  _getPeposForPepocornAmount() {
    const oThis = this;

    let pepoInWeiPerStepFactor = pepocornProductConstants.pepoPerStepFactor(
      pepocornProductConstants.productStepFactor,
      oThis.pepoUsdPricePoint
    );

    let numberOfSteps = new BigNumber(oThis.pepocornAmount).div(
      new BigNumber(pepocornProductConstants.productStepFactor)
    );
    return new BigNumber(pepoInWeiPerStepFactor).mul(numberOfSteps);
  }

  /**
   * Validate price point
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validatePricePoint() {
    const oThis = this;

    const currentTimeInSeconds = Math.round(Date.now() / 1000);

    const dbRows = await new OstPricePointModel()
      .select('conversion_rate')
      .where([
        'created_at > (?) AND quote_currency = (?)',
        currentTimeInSeconds - 3600,
        ostPricePointConstants.invertedQuoteCurrencies[ostPricePointConstants.usdQuoteCurrency]
      ])
      .fire();

    let validationResult = false;
    for (let index = 0; index < dbRows.length; index++) {
      const pricePointEntity = dbRows[index];

      if (new BigNumber(pricePointEntity.conversion_rate).eq(new BigNumber(oThis.pepoUsdPricePoint))) {
        validationResult = true;
      }
    }

    // If price point is not matched in last one hour
    if (!validationResult) {
      return Promise.reject(oThis._errorResponse('a_s_ptu_v_2'));
    }
  }

  /**
   * Error response to send.
   *
   * @param errCode
   * @returns {Promise<never>}
   * @private
   */
  _errorResponse(errCode) {
    const oThis = this;

    return responseHelper.error({
      internal_error_identifier: errCode,
      api_error_identifier: 'invalid_api_params',
      debug_options: {
        productId: oThis.productId,
        pepoAmount: oThis.pepoAmount,
        pepocornAmount: oThis.pepocornAmount,
        pepoUsdPricePoint: oThis.pepoUsdPricePoint,
        currentUserId: oThis.currentUserId
      }
    });
  }
}

module.exports = ValidatePepocornTopup;
