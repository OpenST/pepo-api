/**
 * One time to seed utility branded token in tokens table.
 *
 * Usage: node executables/oneTimers/UpdateUtilityBrandedTokenInTokensTable.js --apiKey "566c9bf2338652283c50c326bab27f14" --apiSecret "33f83e788f9ffb7e474656cd52648102903eb090080239956d01701012b4ba92"
 *
 * @module executables/oneTimers/UpdateUtilityBrandedTokenInTokensTable
 */
const program = require('commander'),
  OSTSDK = require('@ostdotcom/ost-sdk-js');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  TokenModel = require(rootPrefix + '/app/models/mysql/Token');

program
  .option('--apiKey <apiKey>', 'API Key')
  .option('--apiSecret <apiSecret>', 'API Secret')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    '    node executables/oneTimers/UpdateUtilityBrandedTokenInTokensTable.js --apiKey "__ABCD" --apiSecret "__WXYZ"'
  );
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
 * class for update utility branded token in tokens table.
 *
 * @class
 */
class updateUtilityBrandedTokenInTokensTable {
  /**
   * constructor to update utility branded token in tokens table.
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
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._requestTokenDataFromPlatform();

    await oThis._updateTokensTable();
  }

  /**
   * Request token data from platform
   *
   * @returns {Promise<>}
   * @private
   */
  async _requestTokenDataFromPlatform() {
    const oThis = this;

    oThis._initializeSDKObj();

    let tokenServiceResponse = await oThis.tokenService.get();

    if (tokenServiceResponse && tokenServiceResponse.success) {
      let resultType = tokenServiceResponse.data['result_type'];
      oThis.tokenData = tokenServiceResponse.data[resultType];
      logger.step('*----- Fetched Token Service Data from Platform');
    } else {
      return Promise.reject(new Error('No data returned from platform'));
    }
  }

  /**
   * Initialize SDK Obj
   * @private
   */
  _initializeSDKObj() {
    const oThis = this;

    const ostSdkObj = new OSTSDK({
      apiKey: oThis.apiKey,
      apiSecret: oThis.apiSecret,
      apiEndpoint: coreConstants.PA_SA_API_END_POINT
    });

    oThis.tokenService = ostSdkObj.services.tokens;
  }

  /**
   * Update utility branded token in tokens table.
   *
   * @returns {Promise<>}
   * @private
   */
  async _updateTokensTable() {
    const oThis = this;

    // Insert user in database
    let utilityBrandedTokenAddress = oThis.tokenData.auxiliary_chains[0].utility_branded_token;

    let updateResponse = await new TokenModel()
      .update({
        utility_branded_token: utilityBrandedTokenAddress
      })
      .where({ name: oThis.tokenData.name })
      .fire();

    if (!updateResponse) {
      logger.error('Error while updating data in users table');
      return Promise.reject();
    }

    await new SecureTokenCache({}).clear();
  }
}

new updateUtilityBrandedTokenInTokensTable({
  apiSecret: program.apiSecret,
  apiKey: program.apiKey
})
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
