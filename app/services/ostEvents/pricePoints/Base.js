const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  OstPricePointsModel = require(rootPrefix + '/app/models/mysql/OstPricePoints'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  AvailableProductsCache = require(rootPrefix + '/lib/cacheManagement/single/Products'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

/**
 * Class for Ost price points update base.
 *
 * @class PricePointsUpdateBase
 */
class PricePointsUpdateBase extends ServiceBase {
  /**
   * Constructor for Ost price points update base.
   *
   * @param {object} params
   * @param {object} params.data
   * @param {object} params.data.price_point
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.ostPricePoints = params.data.price_point;
  }

  /**
   * Async perform.
   *
   * @sets oThis.ostPricePoints
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const stakeCurrency = await oThis.fetchPepoStakeCurrency();

    oThis.ostPricePoints = oThis.ostPricePoints[stakeCurrency];

    const validationResponse = await oThis.validatePricePoint();

    if (validationResponse.isFailure()) {
      return validationResponse;
    }

    await oThis._updatePricePoint();

    await oThis._clearPricePointsCache();

    await oThis._clearAvailableProductsCache();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate if event is the latest price point for currency.
   *
   * @returns {Promise<string>}
   */
  async validatePricePoint() {
    const oThis = this;

    const queryResponse = await new OstPricePointsModel()
      .select('*')
      .where({ quote_currency: oThis.quoteCurrencyInt })
      .order_by('timestamp DESC')
      .limit(1)
      .fire();

    const dbRow = queryResponse[0];

    if (dbRow && dbRow.timestamp && dbRow.timestamp >= oThis.ostPricePoints.updated_timestamp) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_oe_pp_b_vpp_1',
        api_error_identifier: 'invalid_api_params',
        debug_options: oThis.ostPricePoints
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
      return errorObject;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch pepo stake currency.
   *
   * @returns {Promise<string>}
   */
  async fetchPepoStakeCurrency() {
    const pepoTokenResponse = await new SecureTokenCache().fetch();

    if (pepoTokenResponse.isFailure()) {
      return Promise.reject(new Error('Could not fetch pepo token details.'));
    }

    return pepoTokenResponse.data.stakeCurrency;
  }

  /**
   * Clear price points cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearPricePointsCache() {
    await new PricePointsCache().clear();
  }

  /**
   * Clear available products cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearAvailableProductsCache() {
    await new AvailableProductsCache().clear();
  }

  /**
   * Returns quote currency.
   */
  get quoteCurrency() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Returns integer value of quote currency.
   */
  get quoteCurrencyInt() {
    const oThis = this;

    return ostPricePointsConstants.invertedQuoteCurrencies[oThis.quoteCurrency];
  }

  /**
   * Update price point in ost price points table.
   *
   * @returns {Promise}
   * @private
   */
  async _updatePricePoint() {
    const oThis = this;

    const insertResponse = await new OstPricePointsModel()
      .insert({
        quote_currency: oThis.quoteCurrencyInt,
        conversion_rate: oThis.ostPricePoints[oThis.quoteCurrency],
        timestamp: oThis.ostPricePoints.updated_timestamp
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting price point in ost price points table.');

      return Promise.reject(new Error(insertResponse));
    }
  }
}

module.exports = PricePointsUpdateBase;
