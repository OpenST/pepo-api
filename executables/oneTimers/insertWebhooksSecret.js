/**
 * One timer to insert data in webhooks table
 *
 * Usage: node executables/oneTimers/insertWebhooksSecret.js --webhooksSecret "aa5298d3a3fe181a3a52d085ee1525df57ac498337f8f3b76ca7df0a5de3211b" --webhooksId "2084ec0e-db97-4e8f-94a6-0eab80521da1"
 *
 * @module executables/oneTimers/insertWebhooksSecret
 */
const program = require('commander');

const rootPrefix = '../..',
  WebhooksModel = require(rootPrefix + '/app/models/mysql/Webhook'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  KmsWrapper = require(rootPrefix + '/lib/authentication/KmsWrapper'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms.js');

program
  .option('--webhooksSecret <webhooksSecret>', 'Webhooks Secret')
  .option('--webhooksId <webhooksId>', 'Webhooks Id')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/insertWebhooksSecret.js --webhooksSecret "__WXYZ" --webhooksId "__ABCD"');
  logger.log('');
  logger.log('');
});

if (!program.webhooksSecret) {
  program.help();
  process.exit(1);
}

/**
 * class to insert webhooks secret
 *
 * @class
 */
class insertWebhooksSecret {
  /**
   * constructor to insert webhooks secret
   *
   * @param {string} params.webhooksSecret
   * @param {string} params.webhooksId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.webhooksSecret = params.webhooksSecret;
    oThis.webhooksId = params.webhooksId;
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._encryptWebhooksSecret();

    await oThis._insertDataInWebhooksTable();
  }

  /**
   * Encrypt webhooks secret
   *
   * @returns {Promise<>}
   * @private
   */
  async _encryptWebhooksSecret() {
    const oThis = this;

    let KMSObject = new KmsWrapper(kmsGlobalConstant.platformApiSecretEncryptionPurpose);
    let kmsResp = await KMSObject.generateDataKey();
    const decryptedEncryptionSalt = kmsResp['Plaintext'];

    oThis.encryptedEncryptionSalt = kmsResp['CiphertextBlob'];
    oThis.encryptedWebhooksSecretLC = localCipher.encrypt(decryptedEncryptionSalt, oThis.webhooksSecret);
  }

  /**
   * Inserts data in webhooks table.
   *
   * @returns {Promise<>}
   * @private
   */
  async _insertDataInWebhooksTable() {
    const oThis = this;

    // Insert user in database
    let insertResponse = await new WebhooksModel()
      .update({
        secret: oThis.encryptedWebhooksSecretLC,
        encryption_salt: oThis.encryptedEncryptionSalt
      })
      .where({
        ost_id: oThis.webhooksId
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in users table');
      return Promise.reject();
    }
  }
}

new insertWebhooksSecret({
  webhooksSecret: program.webhooksSecret,
  webhooksId: program.webhooksId
})
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
