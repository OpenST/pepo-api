/**
 * One time to seed tokens table.
 *
 * Usage: node executables/oneTimers/seedTokensTable.js --apiKey "566c9bf2338652283c50c326bab27f14" --apiSecret "33f83e788f9ffb7e474656cd52648102903eb090080239956d01701012b4ba92"
 *
 * @module executables/oneTimers/seedTokensTable
 */
const program = require('commander'),
  OSTSDK = require('@ostdotcom/ost-sdk-js');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms.js'),
  TokenModel = require(rootPrefix + '/app/models/mysql/Token');

program
  .option('--apiKey <apiKey>', 'API Key')
  .option('--apiSecret <apiSecret>', 'API Secret')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/seedTokensTable.js --apiKey "__ABCD" --apiSecret "__WXYZ"');
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
 * class for seed tokens table
 *
 * @class
 */
class seedTokensTable {
  /**
   * constructor to seed tokens table
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

    await oThis._insertDataInTokensTable();
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
    let ruleServiceResponse = await oThis.rulesService.getList({});

    if (tokenServiceResponse && tokenServiceResponse.success) {
      let resultType = tokenServiceResponse.data['result_type'];
      oThis.tokenData = tokenServiceResponse.data[resultType];
      logger.step('*----- Fetched Token Service Data from Platform');
    } else {
      return Promise.reject(new Error('No data returned from platform'));
    }

    if (ruleServiceResponse && ruleServiceResponse.success) {
      let resultType = ruleServiceResponse.data['result_type'];
      oThis.ruleData = ruleServiceResponse.data[resultType];
      logger.step('*----- Fetched Rule Service Data from Platform');
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
    oThis.rulesService = ostSdkObj.services.rules;
  }

  /**
   * Inserts data in tokens table.
   *
   * @returns {Promise<>}
   * @private
   */
  async _insertDataInTokensTable() {
    const oThis = this;

    let KMSObject = new KmsWrapper(kmsGlobalConstant.platformApiSecretEncryptionPurpose);
    let kmsResp = await KMSObject.generateDataKey();
    const decryptedEncryptionSalt = kmsResp['Plaintext'],
      encryptedEncryptionSalt = kmsResp['CiphertextBlob'];

    let encryptedApiSecret = localCipher.encrypt(decryptedEncryptionSalt, oThis.apiSecret);

    let ruleAddresses = {};

    for (let i = 0; i < oThis.ruleData.length; i++) {
      let key = oThis.ruleData[i].name.toString();
      let value = oThis.ruleData[i].address.toLowerCase();
      ruleAddresses[key] = value;
    }

    // Insert user in database
    let insertResponse = await new TokenModel()
      .insert({
        name: oThis.tokenData.name,
        symbol: oThis.tokenData.symbol,
        ost_token_id: oThis.tokenData.id,
        decimal: oThis.tokenData.decimals,
        conversion_factor: oThis.tokenData.conversion_factor,
        company_token_holder_address: oThis.tokenData.auxiliary_chains[0].company_token_holders[0].toLowerCase(),
        rule_addresses: JSON.stringify(ruleAddresses),
        api_key: oThis.apiKey,
        api_secret: encryptedApiSecret,
        encryption_salt: encryptedEncryptionSalt,
        ost_company_user_id: oThis.tokenData.auxiliary_chains[0].company_uuids[0],
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in users table');
      return Promise.reject();
    }
  }
}

new seedTokensTable({
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
