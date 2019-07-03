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
   * Create Sha256 for given String with base64 encoded
   *
   * @param salt
   * @param string
   *
   * @return {String}
   */
  createSha1DigestBase64(salt, string) {
    return Crypto.createHmac('sha1', salt)
      .update(string)
      .digest('base64');
  }

  /**
   * Create md5.
   *
   * @param string
   */
  createMd5Digest(string) {
    return Crypto.createHash('md5')
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

  /**
   * Get file extension.
   *
   * @param {string} fileName
   * @returns {string}
   */
  getFileExtension(fileName) {
    const splitFileNames = fileName.split('.');

    if (splitFileNames.length <= 1) {
      throw new Error('Invalid file name');
    }

    return '.' + splitFileNames.pop();
  }

  /**
   * Get image content type for extension.
   *
   * @param {string} extension
   * @returns {string}
   */
  getImageContentTypeForExtension(extension) {
    extension = extension.toLowerCase();

    switch (extension) {
      case '.bm':
      case '.bmp':
        return 'image/bmp';
      case '.gif':
        return 'image/gif';
      case '.jpe':
      case '.jpeg':
      case '.jpg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.tif':
      case '.tiff':
        return 'image/tiff';
      case '.webp':
        return 'image/webp';
      default:
        throw new Error('Invalid image file extension');
    }
  }

  /**
   * Get video content type for extension.
   *
   * @param extension
   * @returns {string}
   */
  getVideoContentTypeForExtension(extension) {
    extension = extension.toLowerCase();

    switch (extension) {
      case '.mp4':
        return 'video/mp4';
      default:
        throw new Error('Invalid video file extension');
    }
  }
}

module.exports = new Util();
