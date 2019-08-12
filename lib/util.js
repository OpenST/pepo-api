const Crypto = require('crypto');

/**
 * Class for utility functions.
 *
 * @class Util
 */
class Util {
  /**
   * Format DB date.
   *
   * @param {Date} dateObj
   *
   * @return {string}
   */
  formatDbDate(dateObj) {
    function pad(number) {
      return number < 10 ? '0' + number : number;
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
   * Invert JSON.
   *
   * @param {object} obj
   *
   * @return {object}
   */
  invert(obj) {
    const ret = {};

    for (const key in obj) {
      ret[obj[key]] = key;
    }

    return ret;
  }

  /**
   * Clone object.
   *
   * @param {object} obj
   *
   * @return {object}
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
   * Create Sha256 for given String with base64 encoded.
   *
   * @param {string} salt
   * @param {string} string
   *
   * @return {string}
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
   * Create Random string
   *
   * @returns {string}
   */
  createRandomString() {
    return Crypto.randomBytes(8).toString('hex');
  }

  /**
   *
   * Given an integer value (5) and inverted config ({1: 'asb', 2: 'dsds', 4: 'dsdsdsd'}) would return ['asb', 'dsdsdsd']
   *
   * @param {number} intValue
   * @param {object} invertedConfig
   *
   * @return {array}
   */
  getStringsForWhichBitsAreSet(intValue, invertedConfig) {
    const binaryValueArray = intValue.toString(2).split(''),
      setBitsStrings = [];
    for (let index = binaryValueArray.length - 1; index >= 0; index--) {
      if (binaryValueArray[index] == 1) {
        setBitsStrings.push(invertedConfig[Math.pow(2, index)]);
      }
    }

    return setBitsStrings;
  }

  /**
   * Get file extension.
   *
   * @param {string} fileName
   *
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
   *
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
        throw new Error('Invalid image file extension.');
    }
  }

  /**
   * Get version.
   *
   * @param {number/string} userId
   * @param {string} size
   *
   * @returns {string}
   */
  getS3FileName(userId, size) {
    const oThis = this;

    const version = userId + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000000);

    return userId + '-' + oThis.createMd5Digest(version) + '-' + size;
  }

  /**
   * Get S3 url template
   *
   * @param userId
   * @returns {string}
   */
  getS3FileTemplatePrefix(userId) {
    const oThis = this;
    let version = userId + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000000);

    return userId + '-' + oThis.createMd5Digest(version) + '-';
  }

  /**
   * Get video content type for extension.
   *
   * @param {string} extension
   *
   * @returns {string}
   */
  getVideoContentTypeForExtension(extension) {
    extension = extension.toLowerCase();

    switch (extension) {
      case '.mp4': {
        return 'video/mp4';
      }
      default: {
        throw new Error('Invalid video file extension.');
      }
    }
  }
}

module.exports = new Util();
