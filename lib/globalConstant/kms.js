'use strict';
/**
 * Global constants for KMS purposes.
 *
 * @module lib/globalConstant/kms
 */

/**
 * Class for for KMS purposes.
 *
 * @class
 */
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
}

module.exports = new Kms();
