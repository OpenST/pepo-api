require('https').globalAgent.keepAlive = true;

const AWS = require('aws-sdk');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  kms = require(rootPrefix + '/lib/globalConstant/kms');

AWS.config.httpOptions.keepAlive = true;
AWS.config.httpOptions.disableProgressEvents = false;

/**
 * KMS Wrapper to use for encryption and decryption.
 *
 * @Constructor
 * @param purpose - this is the purpose for accessing the KMS service
 */
const KmsWrapper = function(purpose) {
  const oThis = this;

  oThis.purpose = purpose;
};

const _private = {
  // Load AWS credentials
  loadAWSCredentials: function() {
    return {
      accessKeyId: coreConstants.KMS_AWS_ACCESS_KEY,
      secretAccessKey: coreConstants.KMS_AWS_SECRET_KEY,
      region: coreConstants.KMS_AWS_REGION
    };
  },

  // Get Key for different purposes
  getKey: function(purpose) {
    if (purpose === kms.userPasswordEncryptionPurpose) {
      return coreConstants.KMS_API_KEY_ID;
    } else if (purpose === kms.platformApiSecretEncryptionPurpose) {
      return coreConstants.KMS_SECRET_ENC_KEY_ID;
    } else if (purpose === kms.configStrategyEncryptionPurpose) {
      return coreConstants.KMS_SECRET_ENC_KEY_ID;
    } else if (purpose === kms.webhookSecretEncryptionPurpose) {
      return coreConstants.KMS_SECRET_ENC_KEY_ID;
    }
    throw new Error(`Unsupported purpose: ${purpose}`);
  }
};

KmsWrapper.prototype = {
  /**
   * Encrypt data using KMS key
   *
   * @param {String} data - Data to encrypt
   * @return {Promise<any>}
   *
   * @response {CiphertextBlob: Encrypted Blob}
   */
  encrypt: function(data) {
    const oThis = this;

    logger.debug('KMS Encrypt called');
    var kms = new AWS.KMS(_private.loadAWSCredentials());
    var params = {
      KeyId: _private.getKey(oThis.purpose),
      Plaintext: data
    };

    return new Promise(function(onResolve, onReject) {
      kms.encrypt(params, function(err, encryptedData) {
        if (err) {
          onReject(err);
        } else {
          onResolve(encryptedData);
        }
      });
    });
  },

  /**
   * Decrypt Encrypted String using KMS
   *
   * @param {String} encryptedString - Encrypted String to decrypt
   * @return {Promise<any>}
   *
   * @response {Plaintext: Plain text can be used as salt}
   *
   */
  decrypt: function(encryptedString) {
    logger.debug('KMS Decrypt called');
    var kms = new AWS.KMS(_private.loadAWSCredentials());
    var params = {
      CiphertextBlob: encryptedString
    };

    return new Promise(function(onResolve, onReject) {
      kms.decrypt(params, function(err, decryptedData) {
        if (err) {
          onReject(err);
        } else {
          decryptedData.Plaintext = decryptedData.Plaintext.toString('hex');
          onResolve(decryptedData);
        }
      });
    });
  },

  /**
   * Generate New Data Key for usage as local salt
   *
   * @return {Promise<Object>}
   *
   * @response {CiphertextBlob: Encrypted Blob, Plaintext: Plain text can be used as salt}
   */
  generateDataKey: function() {
    const oThis = this;

    logger.debug('KMS generate data key called');
    var kms = new AWS.KMS(_private.loadAWSCredentials());
    var params = {
      KeyId: _private.getKey(oThis.purpose),
      KeySpec: 'AES_256'
    };

    return new Promise(function(onResolve, onReject) {
      kms.generateDataKey(params, function(err, response) {
        if (err) {
          onReject(err);
        } else {
          response.Plaintext = response.Plaintext.toString('hex');
          onResolve(response);
        }
      });
    });
  }
};

module.exports = KmsWrapper;
