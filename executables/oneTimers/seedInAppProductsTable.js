/**
 * One time to seed in app products table.
 *
 * Usage: node executables/oneTimers/seedInAppProductsTable
 *
 * @module executables/oneTimers/seedInAppProductsTable.js
 */
const program = require('commander');

const rootPrefix = '../..',
  InAppProductsModel = require(rootPrefix + '/app/models/mysql/InAppProduct'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  inAppProductsConstants = require(rootPrefix + '/lib/globalConstant/inAppProduct');

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/seedInAppProductsTable.js ');
  logger.log('');
  logger.log('');
});

/**
 * Class to seed inAppProducts table.
 *
 * @class SeedInAppProductsTable
 */
class SeedInAppProductsTable {
  /**
   * Constructor to seed InAppProducts table.
   *
   * @param {string} params.apiSecret
   * @param {string} params.apiKey
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.usdAmountsArray = [1, 2, 5, 10];
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let variable = await oThis._getRunningId();

    await oThis._prepareDataAndInsert(variable);
  }

  /**
   * Get running id.
   *
   * @returns {Promise<number|*>}
   * @private
   */
  async _getRunningId() {
    const oThis = this;

    let queryResponse = await new InAppProductsModel().select('MAX(id) AS id').fire();

    if (!queryResponse[0] || !queryResponse[0].id) {
      return 0;
    }

    return queryResponse[0].id;
  }

  /**
   * prepare data and insert in InAppProducts
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareDataAndInsert(lastExistingId) {
    const oThis = this;

    let initialLowerLimit = 0.0,
      range = 0.1,
      finalUpperLimit = 1.0,
      variable = parseInt(lastExistingId) + 1,
      precision = oThis.countDecimal(range);

    for (
      let lowerLimit = initialLowerLimit;
      lowerLimit < finalUpperLimit;
      lowerLimit = parseFloat(lowerLimit) + parseFloat(range)
    ) {
      let upperLimit = parseFloat(lowerLimit) + parseFloat(range);
      lowerLimit = lowerLimit.toFixed(precision);
      upperLimit = upperLimit.toFixed(precision);

      for (let index = 0; index < oThis.usdAmountsArray.length; index++) {
        let insertData = {
          apple_product_id: 'PROD-APPLE-' + variable,
          google_product_id: 'PROD-GOOGLE-' + variable,
          status: inAppProductsConstants.invertedStatuses[inAppProductsConstants.active],
          lower_limit: lowerLimit,
          upper_limit: upperLimit,
          amount_in_pepo: (oThis.usdAmountsArray[index] * lowerLimit).toFixed(2),
          amount_in_usd: parseFloat(oThis.usdAmountsArray[index])
        };
        variable++;

        let insertResponse = await new InAppProductsModel().insert(insertData).fire();
      }
    }
  }

  /**
   * Count Decimal
   *
   * @param num
   * @returns {number}
   */
  countDecimal(num) {
    const oThis = this;

    if (Math.floor(num) === num) return 0;
    return num.toString().split('.')[1].length || 0;
  }
}

new SeedInAppProductsTable({})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(err);
    process.exit(1);
  });
