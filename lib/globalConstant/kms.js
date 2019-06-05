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

  get passwordEncryptionPurpose() {
    return 'passwordEncryption';
  }

  get userScryptSaltPurpose() {
    return 'userScryptSalt';
  }
}

module.exports = new Kms();
