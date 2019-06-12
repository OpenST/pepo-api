class Kms {
  /**
   * Constructor for for KMS purposes.
   *
   * @constructor
   */
  constructor() {}

  get userPasswordEncryptionPurpose() {
    return 'userPasswordEncryption';
  }

  get tokenUserScryptSaltPurpose() {
    return 'tokenUserScryptSalt';
  }

  get platformApiSecretEncryptionPurpose() {
    return 'platformApiSecretEncryption';
  }
}

module.exports = new Kms();
