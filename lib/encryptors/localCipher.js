'use strict';

/*
  * Local Cipher to encrypt and decrypt client keys
  *
  * * Author: Pankaj
  * * Date: 18/01/2018
  * * Reviewed by:
*/

const rootPrefix = '../..',
  crypto = require('crypto'),
  algorithm = 'aes-256-cbc',
  secretSplitter = '--';

class LocalCipher {
  constructor() {}

  encrypt(salt, string) {
    var encrypt = crypto.createCipher(algorithm, salt);
    var theCipher = encrypt.update(string, 'utf8', 'hex');
    theCipher += encrypt.final('hex');

    return theCipher;
  }

  decrypt(salt, encryptedString) {
    var decrypt = crypto.createDecipher(algorithm, salt);
    var string = decrypt.update(encryptedString, 'hex', 'utf8');
    string += decrypt.final('utf8');

    return string;
  }

  generateApiSignature(stringParams, clientSecret) {
    var hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(stringParams);
    return hmac.digest('hex');
  }

  generateRandomIv() {
    var iv = new Buffer(crypto.randomBytes(16));
    return iv.toString('hex').slice(0, 16);
  }

  /**
   * Generate random salt
   *
   * @returns {string}
   */
  generateRandomSalt() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = new LocalCipher();
