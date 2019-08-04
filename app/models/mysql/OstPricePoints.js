const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

// Declare variables.
const dbName = databaseConstants.ostDbName,
  queryLimit = 20;

/**
 * Class for ost price points model.
 *
 * @class OstPricePointsModel
 */
class OstPricePointsModel extends ModelBase {
  /**
   * Constructor for ost price points model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'ost_price_points';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.quote_currency
   * @param {number} dbRow.conversion_rate
   * @param {number} dbRow.timestamp
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      quoteCurrency: ostPricePointsConstants.quoteCurrencies[dbRow.quote_currency],
      conversionRate: dbRow.conversion_rate,
      timestamp: dbRow.timestamp,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch ost price point for specific quote currency.
   *
   * @param {array<string>} quoteCurrencies
   *
   * @returns {Promise<*>}
   */
  async fetchForQuoteCurrencies(quoteCurrencies) {
    const oThis = this;

    const quoteCurrenciesIntegerValues = [];

    for (let index = 0; index < quoteCurrencies.length; index++) {
      quoteCurrenciesIntegerValues.push(ostPricePointsConstants.invertedQuoteCurrencies[quoteCurrencies[index]]);
    }

    const queryResponse = await oThis
      .select('*')
      .where(['quote_currency IN (?)', quoteCurrenciesIntegerValues])
      .order_by('timestamp DESC')
      .limit(queryLimit)
      .fire();

    const finalResponse = { price_points: {}, quoteCurrencies: {} };

    for (let index = 0; index < queryResponse.length; index++) {
      const pricePointRow = queryResponse[index];

      const quoteCurrencyString = ostPricePointsConstants.quoteCurrencies[pricePointRow.quote_currency];

      if (!finalResponse.price_points[quoteCurrencyString]) {
        finalResponse.price_points[quoteCurrencyString] = pricePointRow.conversion_rate;
        finalResponse.quoteCurrencies[quoteCurrencyString] = true;
      }
    }

    return finalResponse;
  }

  /**
   * Fetch latest price points for all quote currencies.
   *
   * @returns {Promise<{}>}
   */
  async fetchLatestPricePointsForAllQuoteCurrencies() {
    const oThis = this;

    const allQuoteCurrenciesIntegerValues = Object.keys(ostPricePointsConstants.quoteCurrencies);

    const queryResponse = await oThis
      .select('*')
      .where(['quote_currency IN (?)', allQuoteCurrenciesIntegerValues])
      .order_by('timestamp DESC')
      .limit(queryLimit)
      .fire();

    const finalResponse = { price_points: {}, quoteCurrencies: {} };

    for (let index = 0; index < queryResponse.length; index++) {
      const pricePointRow = queryResponse[index];

      const quoteCurrencyString = ostPricePointsConstants.quoteCurrencies[pricePointRow.quote_currency];

      if (!finalResponse.price_points[quoteCurrencyString]) {
        finalResponse.price_points[quoteCurrencyString] = pricePointRow.conversion_rate;
        finalResponse.quoteCurrencies[quoteCurrencyString] = true;
      }
    }

    return finalResponse;
  }
}

module.exports = OstPricePointsModel;
