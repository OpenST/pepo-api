const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  inAppProductsConst = require(rootPrefix + '/lib/globalConstant/inAppProduct'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.fiatDbName;

/**
 * Class for in app products model.
 *
 * @class InAppProduct
 */
class InAppProduct extends ModelBase {
  /**
   * Constructor for InAppProduct model.
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
   * @param {string} dbRow.amount_in_pepo
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
      status: inAppProductsConst.statuses[dbRow.status],
      lowerLimit: dbRow.lower_limit,
      upperLimit: dbRow.upper_limit,
      amountInPepo: dbRow.amount_in_pepo,
      amountInUsd: dbRow.amount_in_usd,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get products for given price point
   *
   * @returns {Promise<void>}
   */
  async getProductsForGivenPricePoint(pricePoint) {
    const oThis = this;

    let queryResponse = await oThis
      .select('*')
      .where([
        'lower_limit <= ? AND upper_limit > ? AND status = ?',
        pricePoint,
        pricePoint,
        inAppProductsConst.invertedStatuses[inAppProductsConst.active]
      ])
      .fire();
    console.log('---queryResponse-------', queryResponse);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = InAppProduct;
