const BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  OstPricePointModel = require(rootPrefix + '/app/models/mysql/OstPricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  pepocornProductConstants = require(rootPrefix + '/lib/globalConstant/pepocornProduct');

/**
 * Class to validate pepocorn topup request.
 *
 * @class ValidatePepocornTopup
 */
class ValidatePepocornTopup extends ServiceBase {
  /**
   * Constructor to validate pepocorn topup request.
   *
   * @param {object} params
   * @param {number} params.product_id
   * @param {number} params.pepo_amount_in_wei
   * @param {number} params.pepocorn_amount
   * @param {number} params.pepo_usd_price_point
   * @param {number} params.request_timestamp
   * @param {object} [params.current_user]
   * @param {number} [params.current_user.id]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.productId = params.product_id;
    oThis.pepoAmount = params.pepo_amount_in_wei;
    oThis.pepocornAmount = params.pepocorn_amount;
    oThis.pepoUsdPricePoint = params.pepo_usd_price_point;
    oThis.requestTimestamp = params.request_timestamp;
    oThis.currentUserId = params.current_user ? params.current_user.id : null;

    oThis.pricePoints = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateInput();

    return responseHelper.successWithData({});
  }

  /**
   * Validate input.
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

    // Pepocorn amount is not divisible by step factor.
    const pepocornAmountBN = new BigNumber(oThis.pepocornAmount),
      stepFactorBN = new BigNumber(pepocornProductConstants.productStepFactor);
    if (!pepocornAmountBN.mod(stepFactorBN).eq(new BigNumber(0))) {
      return Promise.reject(oThis._errorResponse('a_s_ptu_v_3'));
    }

    // Validate number of pepos that can be given.
    if (!oThis._getPeposForPepocornAmount().eq(new BigNumber(oThis.pepoAmount))) {
      return Promise.reject(oThis._errorResponse('a_s_ptu_v_4'));
    }
  }

  /**
   * Validate price point.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validatePricePoint() {
    const oThis = this;

    let usdPricePoints = [];
    // If request time is passed then fetch price points accordingly
    if (oThis.requestTimestamp) {
      const dbRows = await new OstPricePointModel()
        .select('conversion_rate')
        .where([
          'created_at >= (?) AND created_at < (?) AND quote_currency = (?)',
          Number(oThis.requestTimestamp) - 1800,
          Number(oThis.requestTimestamp) + 1800,
          ostPricePointConstants.invertedQuoteCurrencies[ostPricePointConstants.usdQuoteCurrency]
        ])
        .fire();
      for (let index = 0; index < dbRows.length; index++) {
        const pricePointEntity = dbRows[index];
        usdPricePoints.push(pricePointEntity.conversion_rate);
      }
    } else {
      const pricePointsCacheRsp = await new PricePointsCache().fetch();

      if (pricePointsCacheRsp.isFailure()) {
        return Promise.reject(pricePointsCacheRsp);
      }
      const usdPricePoint =
        pricePointsCacheRsp.data[ostPricePointConstants.stakeCurrency][ostPricePointConstants.usdQuoteCurrency];
      usdPricePoints.push(usdPricePoint);
    }
    // Price points in input should be present in array of price points fetched from Db.
    for (let i = 0; i < usdPricePoints.length; i++) {
      if (new BigNumber(usdPricePoints[i]).eq(new BigNumber(oThis.pepoUsdPricePoint))) {
        return true;
      }
    }

    // If price point is not matched the range fetched from db.
    return Promise.reject(oThis._errorResponse('a_s_ptu_v_2'));
  }

  /**
   * Get pepos for pepocorn amount.
   *
   * @returns {BigNumber}
   * @private
   */
  _getPeposForPepocornAmount() {
    const oThis = this;

    const pepoInWeiPerStepFactor = pepocornProductConstants.pepoPerStepFactor(
      pepocornProductConstants.productStepFactor,
      oThis.pepoUsdPricePoint
    );

    const numberOfSteps = new BigNumber(oThis.pepocornAmount).div(
      new BigNumber(pepocornProductConstants.productStepFactor)
    );

    return new BigNumber(pepoInWeiPerStepFactor).mul(numberOfSteps);
  }

  /**
   * Error response to send.
   *
   * @param {string} errCode
   *
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
