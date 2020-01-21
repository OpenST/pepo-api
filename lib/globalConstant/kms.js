/**
 * Class for for KMS purposes.
 *
 * @class Kms
 */
class Kms {
  get userPasswordEncryptionPurpose() {
    return 'userPasswordEncryption';
  }

  get platformApiSecretEncryptionPurpose() {
    return 'platformApiSecretEncryption';
  }

  get configStrategyEncryptionPurpose() {
    return 'configStrategyEncryption';
  }

  get webhookSecretEncryptionPurpose() {
    return 'webhookSecretEncryption';
  }
}

module.exports = new Kms();
