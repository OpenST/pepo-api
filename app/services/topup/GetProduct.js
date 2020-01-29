const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ProductsCache = require(rootPrefix + '/lib/cacheManagement/single/Products'),
  InAppProductConstants = require(rootPrefix + '/lib/globalConstant/inAppProduct'),
  LifetimePurchaseByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/LifetimePurchaseByUserIds'),
  UserProfileElementsByUserId = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

/**
 * Class to get in app purchase products.
 *
 * @class GetTopupProduct
 */
class GetTopupProduct extends ServiceBase {
  /**
   * Constructor to get in app purchase products.
   *
   * @param {object} params
   * @param {object} params.current_user: Current user
   * @param {string} params.os: (android/ios)
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.os = params.os;

    oThis.limitsData = {};
    oThis.limitsData.limit_reached = 0;
    oThis.limitsData.limit = 0;
    oThis.totalLifetimeSpends = null;
    oThis.customPurchaseLimitOfUser = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    const promiseArray = [];

    // Fetch products for the current price point.
    promiseArray.push(oThis._fetchAvailableProducts());

    // Fetch the user purchase data from past.
    promiseArray.push(oThis._fetchUsersPurchaseData());

    // Fetch user purchase limit data.
    promiseArray.push(oThis._fetchUserPurchaseLimitData());

    await Promise.all(promiseArray);

    const remainingLimit = oThis._calculateRemainingLimit(oThis.totalLifetimeSpends),
      availableProductsArray = oThis._filterAvailableProducts(remainingLimit),
      responseData = {};

    if (availableProductsArray.length === 0) {
      oThis.limitsData.limit_reached = 1;
    }

    responseData[entityTypeConstants.topupProducts] = availableProductsArray;
    responseData[entityTypeConstants.topupLimitsData] = oThis.limitsData;

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
   * Fetch available products.
   *
   * @sets oThis.availableProducts
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAvailableProducts() {
    const oThis = this;

    const cacheResponse = await new ProductsCache().fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.availableProducts = cacheResponse.data;
  }

  /**
   * Fetch user purchase data.
   *
   * @sets oThis.totalLifetimeSpends
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUsersPurchaseData() {
    const oThis = this;

    const cacheResponse = await new LifetimePurchaseByUserIdsCache({ userIds: [oThis.currentUser.id] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.totalLifetimeSpends = cacheResponse.data[oThis.currentUser.id].amount;
  }

  /**
   * Fetch user's purchase limit.
   *
   * @sets oThis.customPurchaseLimitOfUser
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserPurchaseLimitData() {
    const oThis = this;

    const cacheResponse = await new UserProfileElementsByUserId({ usersIds: [oThis.currentUser.id] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const lifetimePurchaseLimitForUser =
      cacheResponse.data[oThis.currentUser.id][userProfileElementConst.lifetimePurchaseLimitKind];

    if (lifetimePurchaseLimitForUser) {
      oThis.customPurchaseLimitOfUser = lifetimePurchaseLimitForUser.data;
    }
  }

  /**
   * Calculates remaining limit using spends data.
   *
   * @param {number} amountSpent
   *
   * @returns {number}
   * @private
   */
  _calculateRemainingLimit(amountSpent) {
    const oThis = this;

    let remainingLimit = InAppProductConstants.lifetimeLimit - amountSpent;

    oThis.limitsData.limit = InAppProductConstants.lifetimeLimit;
    if (!CommonValidators.isVarNullOrUndefined(oThis.customPurchaseLimitOfUser)) {
      remainingLimit = oThis.customPurchaseLimitOfUser - amountSpent;
      oThis.limitsData.limit = oThis.customPurchaseLimitOfUser;
    }

    return remainingLimit;
  }

  /**
   * Filter outs products which a user can buy after considering limits.
   *
   * @param {number} remainingLimit
   *
   * @returns {[]}
   * @private
   */
  _filterAvailableProducts(remainingLimit) {
    const oThis = this;

    const productsArray = oThis.availableProducts.products,
      availableProductsArray = [];

    for (let index = 0; index < productsArray.length; index++) {
      // Check if products price is less than remaining limit.
      if (productsArray[index].amountInUsd <= remainingLimit) {
        if (oThis.os === InAppProductConstants.ios) {
          // If the os is ios, products with apple product id are only filtered.
          if (productsArray[index].appleProductId) {
            productsArray[index].id = productsArray[index].appleProductId;
            availableProductsArray.push(productsArray[index]);
          }
        } else if (oThis.os === InAppProductConstants.android) {
          // If the os is android, products with google product id are only filtered.
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
