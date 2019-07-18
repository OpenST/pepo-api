/**
 * One time to seed ost price points table.
 *
 * Usage: node executables/oneTimers/seedOstPricePointsTable --apiKey "566c9bf2338652283c50c326bab27f14" --apiSecret "33f83e788f9ffb7e474656cd52648102903eb090080239956d01701012b4ba92"
 *
 * @module executables/oneTimers/seedOstPricePointsTable
 */
const program = require('commander'),
  OSTSDK = require('@ostdotcom/ost-sdk-js');

const rootPrefix = '../..',
  OstPricePointsModel = require(rootPrefix + '/app/models/mysql/OstPricePoints'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

program
  .option('--apiKey <apiKey>', 'API Key')
  .option('--apiSecret <apiSecret>', 'API Secret')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/seedOstPricePointsTable.js --apiKey "__ABCD" --apiSecret "__WXYZ"');
  logger.log('');
  logger.log('');
});

if (!program.apiKey) {
  program.help();
  process.exit(1);
}

if (!program.apiSecret) {
  program.help();
  process.exit(1);
}

/**
 * Class to seed ost price points table.
 *
 * @class SeedOstPricePointsTable
 */
class SeedOstPricePointsTable {
  /**
   * Constructor to seed ost price points table.
   *
   * @param {string} params.apiSecret
   * @param {string} params.apiKey
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.apiSecret = params.apiSecret;
    oThis.apiKey = params.apiKey;
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._requestPricePointsDataFromPlatform();

    await oThis._insertDataInOstPricePointsTable();
  }

  /**
   * Request price points data from platform
   *
   * @returns {Promise<>}
   * @private
   */
  async _requestPricePointsDataFromPlatform() {
    const oThis = this;

    oThis._initializeSDKObj();

    let secureTokenData = await new SecureTokenCache({}).fetch();

    if (secureTokenData.isFailure()) {
      return Promise.reject(secureTokenData);
    }

    let chainId = secureTokenData.data.auxChainId;
    let pricePointsServiceResponse = await oThis.pricePointsService.get({ chain_id: chainId });

    if (!pricePointsServiceResponse.success) {
      return Promise.reject(pricePointsServiceResponse);
    }

    if (pricePointsServiceResponse && pricePointsServiceResponse.success) {
      let resultType = pricePointsServiceResponse.data.result_type;
      oThis.pricePointsData = pricePointsServiceResponse.data[resultType];
      logger.step('*----- Fetched Price Points Service Data from Platform.');
    } else {
      return Promise.reject(new Error('No data returned from platform'));
    }
  }

  /**
   * Initialize SDK Obj.
   *
   * @private
   */
  _initializeSDKObj() {
    const oThis = this;

    const ostSdkObj = new OSTSDK({
      apiKey: oThis.apiKey,
      apiSecret: oThis.apiSecret,
      apiEndpoint: coreConstants.PA_SA_API_END_POINT
    });

    oThis.pricePointsService = ostSdkObj.services.price_points;
  }

  /**
   * Inserts data in ost price points table.
   *
   * @returns {Promise<>}
   * @private
   */
  async _insertDataInOstPricePointsTable() {
    const oThis = this;

    for (const baseCurrency in oThis.pricePointsData) {
      for (const quoteCurrency in oThis.pricePointsData[baseCurrency]) {
        if (quoteCurrency === 'decimals' || quoteCurrency === 'updated_timestamp') {
          continue;
        }

        await new OstPricePointsModel()
          .insert({
            quote_currency: ostPricePointsConstants.invertedQuoteCurrencies[quoteCurrency],
            conversion_rate: oThis.pricePointsData[baseCurrency][quoteCurrency],
            timestamp: oThis.pricePointsData[baseCurrency].updated_timestamp
          })
          .fire();
      }
    }
  }
}

new SeedOstPricePointsTable({
  apiSecret: program.apiSecret,
  apiKey: program.apiKey
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(err);
    process.exit(1);
  });
