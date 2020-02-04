const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  inAppProductsConstants = require(rootPrefix + '/lib/globalConstant/inAppProduct');

// Declare variables.
const dbName = databaseConstants.fiatDbName;

/**
 * Class for in app products model.
 *
 * @class InAppProductModel
 */
class InAppProductModel extends ModelBase {
  /**
   * Constructor for in app products model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'in_app_products';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.apple_product_id
   * @param {string} dbRow.google_product_id
   * @param {string} dbRow.status
   * @param {string} dbRow.lower_limit
   * @param {string} dbRow.upper_limit
   * @param {string} dbRow.pepo_amount_in_wei
   * @param {number} dbRow.amount_in_usd
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @returns {object}
   * @private
   */
  _formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      appleProductId: dbRow.apple_product_id,
      googleProductId: dbRow.google_product_id,
      status: inAppProductsConstants.statuses[dbRow.status],
      lowerLimit: dbRow.lower_limit,
      upperLimit: dbRow.upper_limit,
      pepoAmountInWei: dbRow.pepo_amount_in_wei,
      amountInUsd: dbRow.amount_in_usd,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get products for given price point.
   *
   * @param {float} pricePoint: price point in USD unit - this is the value of one Pepo currently in USD.
   *
   * @return {Promise<Array>}
   */
  async getProductsForGivenPricePoint(pricePoint) {
    const oThis = this;

    const queryResponse = await oThis
      .select('*')
      .where([
        'lower_limit <= ? AND upper_limit > ? AND status = ?',
        pricePoint,
        pricePoint,
        inAppProductsConstants.invertedStatuses[inAppProductsConstants.active]
      ])
      .order_by('amount_in_usd asc')
      .fire();

    const responseData = [];

    for (let index = 0; index < queryResponse.length; index++) {
      const rowData = oThis._formatDbData(queryResponse[index]);
      responseData.push(rowData);
    }

    return responseData;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache() {
    const GetTopupProduct = require(rootPrefix + '/lib/cacheManagement/single/Products');
    await new GetTopupProduct({}).clear();
  }
}

module.exports = InAppProductModel;
