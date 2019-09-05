const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ProductsCache = require(rootPrefix + '/lib/cacheManagement/single/Products'),
  FiatPaymentsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FiatPaymentsByUserIds'),
  InAppProductConstants = require(rootPrefix + '/lib/globalConstant/inAppProduct'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get in app purchase products
 *
 * @class
 */
class GetAvailableProducts extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param params.current_user {Object} - Current user
   * @param params.os {String} - os (android/ios)
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.os = params.os;

    oThis.limitsData = {};
    oThis.limitsData.monthlyLimitReached = 0;
    oThis.limitsData.weeklyLimitReached = 0;
    oThis.limitsData.dailyLimitReached = 0;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    let promiseArray = [];
    promiseArray.push(oThis._fetchAvailableProducts());
    promiseArray.push(oThis._fetchUsersPurchaseData());

    await Promise.all(promiseArray);

    let spendsData = oThis._getSpendsData(oThis.totalSpendsArray),
      remainingLimit = oThis._calculateRemainingLimit(spendsData),
      availableProducts = oThis._filterAvailableProducts(remainingLimit),
      formattedProductsArray = oThis._formatProductsData(availableProducts),
      responseData = {
        products: formattedProductsArray,
        limits_data: oThis.limitsData
      };

    return responseHelper.successWithData(responseData);
  }

  /**
   * Fetch available products
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAvailableProducts() {
    const oThis = this;

    let cacheResponse = await new ProductsCache().fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.availableProducts = cacheResponse.data;
  }

  /**
   * Fetch user purchase data
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUsersPurchaseData() {
    const oThis = this;

    let cacheResponse = await new FiatPaymentsByUserIdsCache().fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.totalSpendsArray = cacheResponse.data[oThis.currentUser.id];
  }

  /**
   * Get spends data
   *
   * @param totalSpendsArray
   * @returns {{monthlySpends: number, dailySpends: number, weeklySpends: number}}
   * @private
   */
  _getSpendsData(totalSpendsArray) {
    const oThis = this;

    let before24HoursTimeStamp = null,
      before7DaysTimeStamp = null,
      before30DaysTimeStamp = null,
      spendsData = {
        dailySpends: 0,
        weeklySpends: 0,
        monthlySpends: 0
      };

    for (let i = 0; i < totalSpendsArray.length; i++) {
      let paymentDoneTimestamp = totalSpendsArray[i].createdAt;
      if (paymentDoneTimestamp > before24HoursTimeStamp) {
        spendsData.dailySpends = spendsData.dailySpends + totalSpendsArray[i].amount;
        spendsData.weeklySpends = spendsData.weeklySpends + totalSpendsArray[i].amount;
        spendsData.monthlySpends = spendsData.monthlySpends + totalSpendsArray[i].amount;
      } else if (paymentDoneTimestamp > before7DaysTimeStamp && paymentDoneTimestamp < before24HoursTimeStamp) {
        spendsData.weeklySpends = spendsData.weeklySpends + totalSpendsArray[i].amount;
        spendsData.monthlySpends = spendsData.monthlySpends + totalSpendsArray[i].amount;
      } else if (paymentDoneTimestamp > before30DaysTimeStamp && paymentDoneTimestamp < before7DaysTimeStamp) {
        spendsData.monthlySpends = spendsData.monthlySpends + totalSpendsArray[i].amount;
      }
    }

    return spendsData;
  }

  /**
   * Calculates remaining limit using spends data
   *
   * @param spendsData
   * @returns {number}
   * @private
   */
  _calculateRemainingLimit(spendsData) {
    const oThis = this;

    let monthlyRemainingProductsCost = InAppProductConstants.monthlyLimit - spendsData.monthlySpends,
      weeklyRemainingProductsCost = InAppProductConstants.weeklyLimit - spendsData.weeklySpends,
      dailyRemainingProductsCost = InAppProductConstants.dailyLimit - spendsData.dailySpends,
      actualRemainingLimit = Math.min(
        monthlyRemainingProductsCost,
        weeklyRemainingProductsCost,
        dailyRemainingProductsCost
      );

    if (monthlyRemainingProductsCost <= 0) {
      oThis.limitsData.monthlyLimitReached = 1;
    }

    if (weeklyRemainingProductsCost <= 0) {
      oThis.limitsData.weeklyLimitReached = 1;
    }

    if (dailyRemainingProductsCost <= 0) {
      oThis.limitsData.dailyLimitReached = 1;
    }
    return actualRemainingLimit;
  }

  /**
   * Filter outs products which a user can buy after considering limits
   *
   * @param remainingLimit
   * @returns {[]}
   * @private
   */
  _filterAvailableProducts(remainingLimit) {
    const oThis = this;

    let productsArray = oThis.availableProducts.products,
      availableProductsArray = [];

    for (let index = 0; index < productsArray; index++) {
      if (productsArray[index].amountInUsd < remainingLimit) {
        availableProductsArray.push(productsArray[index]);
      }
    }

    return availableProductsArray;
  }

  /**
   * Format products array as expected by FE.
   *
   * @param productsArray
   * @returns {[]}
   * @private
   */
  _formatProductsData(productsArray) {
    const oThis = this,
      formattedProductsArray = [];

    for (let i = 0; i < productsArray.length; i++) {
      let formattedProductData = {};
      if (oThis.os === InAppProductConstants.ios) {
        if (!productsArray[i].appleProductId) {
          continue;
        }
        formattedProductData.id = productsArray[i].appleProductId;
      } else {
        if (!productsArray[i].googleProductId) {
          continue;
        }
        formattedProductData.id = productsArray[i].googleProductId;
      }
      formattedProductData.amount_in_usd = productsArray[i].amountInUsd;
      formattedProductData.amount_in_pepo = productsArray[i].amountInPepo;
      formattedProductData.uts = productsArray[i].updatedAt;
      formattedProductsArray.push(formattedProductData);
    }

    return formattedProductsArray;
  }
}

module.exports = GetAvailableProducts;
