const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
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

    await oThis._validateAndSanitize();

    let promiseArray = [];

    // Fetch products for the current price point
    promiseArray.push(oThis._fetchAvailableProducts());

    // Fetch the user purchase data from past
    promiseArray.push(oThis._fetchUsersPurchaseData());

    // Fetch user purchase limit data
    promiseArray.push(oThis._fetchUserPurchaseLimitData());

    await Promise.all(promiseArray);

    let remainingLimit = oThis._calculateRemainingLimit(oThis.totalLifetimeSpends),
      availableProductsArray = oThis._filterAvailableProducts(remainingLimit),
      responseData = {
        products: availableProductsArray,
        limits_data: oThis.limitsData
      };

    return responseHelper.successWithData(responseData);
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    if (oThis.os !== InAppProductConstants.ios && oThis.os !== InAppProductConstants.android) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_t_gp_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_os'],
          debug_options: { os: oThis.os }
        })
      );
    }
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

    let cacheResponse = await new LifetimePurchaseByUserIdCache({ userId: oThis.currentUser.id }).fetch();

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

    let lifetimePurchaseLimitForUser =
      cacheResponse.data[oThis.currentUser.id][userProfileElementConst.lifetimePurchaseLimitKind];

    if (lifetimePurchaseLimitForUser) {
      oThis.customPurchaseLimitOfUser = lifetimePurchaseLimitForUser.data;
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

    if (!CommonValidators.isVarNullOrUndefined(oThis.customPurchaseLimitOfUser)) {
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
      //Check if products price is less than remaining limit
      if (productsArray[index].amountInUsd <= remainingLimit) {
        if (oThis.os === InAppProductConstants.ios) {
          //If the os is ios, products with apple product id are only filtered.
          if (productsArray[index].appleProductId) {
            productsArray[index].id = productsArray[index].appleProductId;
            availableProductsArray.push(productsArray[index]);
          }
        } else if (oThis.os === InAppProductConstants.android) {
          //If the os is android, products with google product id are only filtered.
          if (productsArray[index].googleProductId) {
            productsArray[index].id = productsArray[index].googleProductId;
            availableProductsArray.push(productsArray[index]);
          }
        }
      }
    }
    return availableProductsArray;
  }
}

module.exports = GetTopupProduct;
