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
}

module.exports = new Kms();
