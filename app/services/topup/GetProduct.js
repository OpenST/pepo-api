const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ProductsCache = require(rootPrefix + '/lib/cacheManagement/single/Products'),
  InAppProductConstants = require(rootPrefix + '/lib/globalConstant/inAppProduct'),
  LifetimePurchaseByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/LifetimePurchaseByUserId'),
  UserProfileElementsByUserId = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

/**
 * Class to get in app purchase products
 *
 * @class
 */
class GetTopupProduct extends ServiceBase {
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
    oThis.limitsData.lifetime_limit_reached = 0;
    oThis.totalLifetimeSpends = null;
    oThis.customPurchaseLimitOfUser = null;
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
    promiseArray.push(oThis._fetchUserPurchaseLimitData());

    await Promise.all(promiseArray);

    let remainingLimit = oThis._calculateRemainingLimit(oThis.totalLifetimeSpends),
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

    let cacheResponse = await new LifetimePurchaseByUserIdCache({ userId: [oThis.currentUser.id] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.totalLifetimeSpends = cacheResponse.data[oThis.currentUser.id];
  }

  /**
   * Fetch user's purchase limit.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserPurchaseLimitData() {
    const oThis = this;

    let cacheResponse = await new UserProfileElementsByUserId({ usersIds: [oThis.currentUser.id] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    if (cacheResponse.data[oThis.currentUser.id][userProfileElementConst.lifetimePurchaseLimitKind]) {
      oThis.customPurchaseLimitOfUser =
        cacheResponse.data[oThis.currentUser.id][userProfileElementConst.lifetimePurchaseLimitKind].data;
    }
  }

  /**
   * Calculates remaining limit using spends data
   *
   * @param amountSpent
   * @returns {number}
   * @private
   */
  _calculateRemainingLimit(amountSpent) {
    const oThis = this;

    let remainingLimit = InAppProductConstants.lifetimeLimit - amountSpent;

    if (oThis.customPurchaseLimitOfUser) {
      remainingLimit = oThis.customPurchaseLimitOfUser - amountSpent;
    }

    if (remainingLimit <= 0) {
      oThis.limitsData.lifetime_limit_reached = 1;
    }

    return remainingLimit;
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

    for (let index = 0; index < productsArray.length; index++) {
      if (productsArray[index].amountInUsd <= remainingLimit) {
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

module.exports = GetTopupProduct;
