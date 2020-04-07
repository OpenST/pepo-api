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
   * @returns {string}
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
   * @returns {object}
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
   * @returns {object}
   */
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Create SHA256 for given string.
   *
   * @param {string} salt
   * @param {string} string
   *
   * @returns {string}
   */
  createSha256Digest(salt, string) {
    return Crypto.createHmac('sha256', salt)
      .update(string)
      .digest('hex');
  }

  /**
   * Create SHA256 for given string with base64 encoded.
   *
   * @param {string} salt
   * @param {string} string
   *
   * @returns {string}
   */
  createSha1DigestBase64(salt, string) {
    return Crypto.createHmac('sha1', salt)
      .update(string)
      .digest('base64');
  }

  /**
   * Create MD5.
   *
   * @param {string} string
   */
  createMd5Digest(string) {
    return Crypto.createHash('md5')
      .update(string)
      .digest('hex');
  }

  generateWebhookSecret() {
    const oThis = this;

    const uniqueStr = Crypto.randomBytes(64).toString('hex');

    return oThis.createSha256Digest(uniqueStr, uniqueStr);
  }

  /**
   * Create random string.
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
   * @returns {array}
   */
  getStringsForWhichBitsAreSet(intValue, invertedConfig) {
    const binaryValueArray = intValue.toString(2).split(''),
      setBitsStrings = [];

    for (let index = binaryValueArray.length - 1; index >= 0; index--) {
      if (binaryValueArray[index] == 1) {
        const bitMultiplier = Math.pow(2, binaryValueArray.length - 1 - index);
        setBitsStrings.push(invertedConfig[bitMultiplier]);
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
        return null;
    }
  }

  /**
   * Get version.
   *
   * @param {string} size
   * @param {number} [userId]
   *
   * @returns {string}
   */
  getS3FileName(size, userId = 0) {
    const oThis = this;

    let s3FileName = '';

    if (userId) {
      const version = userId + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000000);
      s3FileName = userId + '-' + oThis.createMd5Digest(version) + '-' + size;
    } else {
      // The below code block is used to get s3FileName for channels.
      const version = new Date().getTime() + '-' + Math.floor(Math.random() * 100000000);
      s3FileName = oThis.createMd5Digest(version) + '-' + size;
    }

    return s3FileName;
  }

  /**
   * Get S3 url template.
   *
   * @param {string/number} userId
   *
   * @returns {string}
   */
  getS3FileTemplatePrefix(userId) {
    const oThis = this;

    const version = userId + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000000);

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
      case '.mov': {
        return 'video/quicktime';
      }
      default: {
        throw new Error('Invalid video file extension.');
      }
    }
  }

  /**
   * Get key for videoId and tagId map.
   *
   * @param {number} videoId
   * @param {number} tagId
   *
   * @returns {string}
   * @private
   */
  getVideoIdAndTagIdMapKey(videoId, tagId) {
    return `${videoId}_${tagId}`;
  }
}

module.exports = new Util();
