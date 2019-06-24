const Crypto = require('crypto'),
  web3Utils = require('web3-utils'),
  Buffer = require('safe-buffer').Buffer;

const rootPrefix = '..',
  bitHelper = require(rootPrefix + '/helpers/bit');

class Util {
  constructor() {}

  /**
   * Format DB date
   *
   * @param dateObj
   * @return {string}
   */
  formatDbDate(dateObj) {
    function pad(n) {
      return n < 10 ? '0' + n : n;
    }

    return (
      dateObj.getFullYear() +
      '-' +
      pad(dateObj.getMonth() + 1) +
      '-' +
      pad(dateObj.getDate()) +
      ' ' +
      pad(dateObj.getHours()) +
      ':' +
      pad(dateObj.getMinutes()) +
      ':' +
      pad(dateObj.getSeconds())
    );
  }

  /**
   * Invert JSON
   *
   * @param obj
   * @return {Object}
   */
  invert(obj) {
    let ret = {};
    for (let key in obj) {
      ret[obj[key]] = key;
    }
    return ret;
  }

  /**
   * Clone object
   *
   * @param obj
   * @return {Object}
   */
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Create Sha256 for given String
   *
   * @param salt
   * @param string
   *
   * @return {String}
   */
  createSha256Digest(salt, string) {
    return Crypto.createHmac('sha256', salt)
      .update(string)
      .digest('hex');
  }

  /**
   *
   * Given an integer value (5) and inverted config ({1: 'asb', 2: 'dsds', 4: 'dsdsdsd'}) would return ['asb', 'dsdsdsd']
   *
   * @param intValue
   * @param invertedConfig
   * @return {Array}
   */
  getStringsForWhichBitsAreSet(intValue, invertedConfig) {
    let binaryValueArray = intValue.toString(2).split(''),
      setBitsStrings = [];
    for (let i = binaryValueArray.length - 1; i >= 0; i--) {
      if (binaryValueArray[i] == 1) {
        setBitsStrings.push(invertedConfig[Math.pow(2, i)]);
      }
    }
    return setBitsStrings;
  }
}

module.exports = new Util();
