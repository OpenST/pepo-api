/**
 * Perform basic validations
 *
 * @module helpers/basic
 */

const BigNumber = require('bignumber.js');

const rootPrefix = '..',
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  apiErrorConfig = require(rootPrefix + '/config/apiParams/apiErrorConfig'),
  v1ParamErrorConfig = require(rootPrefix + '/config/apiParams/v1/errorConfig'),
  adminParamErrorConfig = require(rootPrefix + '/config/apiParams/admin/errorConfig'),
  webParamErrorConfig = require(rootPrefix + '/config/apiParams/web/errorConfig'),
  internalParamErrorConfig = require(rootPrefix + '/config/apiParams/internal/errorConfig');

/**
 * Class for basic helper.
 *
 * @class BasicHelper
 */
class BasicHelper {
  /**
   * Convert wei value to un wei (normal).
   *
   * @param {string} wei
   *
   * @return {BigNumber}
   */
  convertWeiToNormal(wei) {
    return this.convertToBigNumber(wei).div(this.convertToBigNumber(10).toPower(18));
  }

  /**
   * Convert input to lower unit.
   *
   * @param {string/number} num
   * @param {number} decimals - decimals of the coin
   *
   * @return {BigNumber}
   */
  convertToLowerUnit(num, decimals) {
    return this.convertToBigNumber(num).mul(this.convertToBigNumber(10).toPower(decimals));
  }

  /**
   * Convert lower unit value to normal.
   *
   * @param {string} wei
   * @param {Number} decimals
   *
   * @return {BigNumber}
   */
  convertLowerUnitToNormal(wei, decimals) {
    return this.convertToBigNumber(wei).div(this.convertToBigNumber(10).toPower(decimals));
  }

  /**
   * Convert wei value to un wei (normal).
   *
   * @param {string} wei
   * @param {number} decimals
   *
   * @return {string}
   */
  toNormalPrecisionBT(wei, decimals) {
    return this.toNormalPrecision(wei, 5, decimals);
  }

  /**
   * Convert wei value to un wei (normal).
   *
   * @param {string} wei
   * @param {number} decimals
   *
   * @return {string}
   */
  toNormalPrecisionFiat(wei, decimals) {
    return this.toNormalPrecision(wei, 2, decimals);
  }

  /**
   * Convert wei value to un wei (normal).
   *
   * @param {string} wei
   * @param {number} precision
   *
   * @return {string}
   */
  toPrecision(wei, precision) {
    const normalValue = this.convertToBigNumber(wei).div(this.convertToBigNumber(10).toPower(18));

    return normalValue.toFixed(precision, BigNumber.ROUND_HALF_UP).toString(10);
  }

  /**
   * Convert wei value to un wei (normal).
   *
   * @param {string} wei
   * @param {number} precision
   * @param {number} decimals
   *
   * @return {string}
   */
  toNormalPrecision(wei, precision, decimals) {
    const normalValue = this.convertToBigNumber(wei).div(this.convertToBigNumber(10).toPower(decimals));

    return normalValue.toFixed(precision, BigNumber.ROUND_HALF_UP).toString(10);
  }

  /**
   * Create a duplicate object.
   *
   * @return {object}
   */
  deepDup(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Convert the given big number in Gwei to wei.
   *
   * @param {BigNumber} num
   */
  convertGweiToWei(num) {
    return this.convertToBigNumber(num).mul(this.convertToBigNumber(10).toPower(9));
  }

  /**
   * Convert wei to proper string. Make sure it's a valid number.
   *
   * @param {number} amountInWei: amount in wei to be formatted
   *
   * @return {string}
   */
  formatWeiToString(amountInWei) {
    const oThis = this;

    return oThis.convertToBigNumber(amountInWei).toString(10);
  }

  /**
   * Convert number to big number. Make sure it's a valid number.
   *
   * @param {number} number: number to be formatted
   *
   * @return {BigNumber}
   */
  convertToBigNumber(number) {
    return number instanceof BigNumber ? number : new BigNumber(number);
  }

  /**
   * Convert number to Hex.
   *
   * @param {number} number: number to be formatted
   *
   * @return {string}
   */
  convertToHex(number) {
    return '0x' + new BigNumber(number).toString(16).toUpperCase();
  }

  /**
   * Convert Hex to String.
   *
   * @param {string} string: Hex string
   *
   * @return {string}
   */
  convertHexToString(string) {
    const buf = new Buffer.from(string, 'hex');

    return buf.toString('utf8');
  }

  /**
   * Convert Hex to String.
   *
   * @param {string} string: Hex string
   *
   * @return {string}
   */
  convertStringToHex(string) {
    const buf = new Buffer.from(string, 'utf8');

    return buf.toString('hex');
  }

  /**
   * Check if address is valid or not.
   *
   * @param {string} address
   *
   * @return {boolean}
   */
  isAddressValid(address) {
    if (typeof address !== 'string') {
      return false;
    }

    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  /**
   * Check if eth address is valid or not.
   *
   * @param {string} address
   *
   * @return {boolean}
   */
  isEthAddressValid(address) {
    if (typeof address !== 'string') {
      return false;
    }

    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  /**
   * Check if eth address is valid or not.
   *
   * @param {string} address
   *
   * @return {boolean}
   */
  isTxHashValid(txHash) {
    if (typeof txHash !== 'string') {
      return false;
    }

    return /^0x[0-9a-fA-F]{64}$/.test(txHash);
  }

  /**
   * Shuffle an array.
   *
   * @param {array} array
   *
   * @return {array}
   */
  shuffleArray(array) {
    for (let elementOne = array.length - 1; elementOne >= 0; elementOne--) {
      const elementTwo = Math.floor(Math.random() * (elementOne + 1));
      const temp = array[elementOne];
      array[elementOne] = array[elementTwo];
      array[elementTwo] = temp;
    }

    return array;
  }

  /**
   * Fetch Error Config.
   *
   * @param {string} apiVersion
   * @param {object} dynamicErrorConfig
   *
   * @return {object}
   */
  fetchErrorConfig(apiVersion, dynamicErrorConfig) {
    let paramErrorConfig;

    if (apiVersion === apiVersions.v1) {
      paramErrorConfig = dynamicErrorConfig
        ? Object.assign(dynamicErrorConfig, v1ParamErrorConfig)
        : v1ParamErrorConfig;
    } else if (apiVersion === apiVersions.internal) {
      paramErrorConfig = dynamicErrorConfig
        ? Object.assign(dynamicErrorConfig, internalParamErrorConfig)
        : internalParamErrorConfig;
    } else if (apiVersion === apiVersions.admin) {
      paramErrorConfig = dynamicErrorConfig ? Object.assign(dynamicErrorConfig, {}) : {};
    } else if (apiVersion === apiVersions.web) {
      paramErrorConfig = dynamicErrorConfig
        ? Object.assign(dynamicErrorConfig, webParamErrorConfig)
        : webParamErrorConfig;
    } else {
      throw new Error(`Unsupported API Version ${apiVersion}`);
    }

    return {
      param_error_config: paramErrorConfig,
      api_error_config: apiErrorConfig
    };
  }

  /**
   * Convert a common separated string to array.
   *
   * @param {string} str
   *
   * @return {array}
   */
  commaSeperatedStrToArray(str) {
    return str.split(',').map((ele) => ele.trim());
  }

  /**
   * Check if environment is production.
   *
   * @return {boolean}
   */
  isProduction() {
    return coreConstants.environment === 'production';
  }

  /**
   * Check if environment is staging.
   *
   * @return {boolean}
   */
  isStaging() {
    return coreConstants.environment === 'staging';
  }

  /**
   * Check if environment is development.
   *
   * @return {boolean}
   */
  isDevelopment() {
    return coreConstants.environment === 'development';
  }

  /**
   * Log date format.
   *
   * @returns {string}
   */
  logDateFormat() {
    const date = new Date();

    return (
      date.getFullYear() +
      '-' +
      (date.getMonth() + 1) +
      '-' +
      date.getDate() +
      ' ' +
      date.getHours() +
      ':' +
      date.getMinutes() +
      ':' +
      date.getSeconds() +
      '.' +
      date.getMilliseconds()
    );
  }

  /**
   * Get current timestamp in seconds.
   *
   * @return {number}
   */
  getCurrentTimestampInSeconds() {
    return Math.floor(new Date().getTime() / 1000);
  }

  /**
   * Get current timestamp in minutes.
   *
   * @return {number}
   */
  getCurrentTimestampInMinutes() {
    return Math.floor(new Date().getTime() / (60 * 1000));
  }

  /**
   * Checks whether the object is empty or not.
   *
   * @param {object} obj
   *
   * @return {boolean}
   */
  isEmptyObject(obj) {
    for (const property in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, property)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get random number between the range of min and max.
   *
   * @param {number} min
   * @param {number} max
   *
   * @return {number}
   */
  getRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Encrypt page identifier.
   *
   * @param {string} object
   *
   * @return {string}
   */
  encryptPageIdentifier(object) {
    return base64Helper.encode(JSON.stringify(object));
  }

  /**
   * Decrypt page identifier.
   *
   * @param {string} string
   *
   * @return {any}
   */
  decryptPageIdentifier(string) {
    return JSON.parse(base64Helper.decode(string));
  }

  /**
   * Sanitize address.
   *
   * @param {string} address
   *
   * @return {string | *}
   */
  sanitizeAddress(address) {
    return address.toLowerCase();
  }

  /**
   * Sanitize uuid.
   *
   * @param {string} uuid
   *
   * @return {string | *}
   */
  sanitizeuuid(uuid) {
    return uuid.toLowerCase();
  }

  /**
   * Convert date to timestamp in seconds.
   *
   * @param {string} dateStr
   *
   * @return {number} timestamp
   */
  dateToSecondsTimestamp(dateStr) {
    return Math.floor(new Date(dateStr).getTime() / 1000);
  }

  /**
   * Convert date to timestamp in milli-seconds..
   *
   * @param {string} dateStr
   *
   * @return {number} timestamp
   */
  dateToMilliSecondsTimestamp(dateStr) {
    return new Date(dateStr).getTime();
  }

  /**
   * Timestamp in seconds.
   *
   * @return {number}
   */
  timestampInSeconds() {
    return Math.floor(new Date() / 1000);
  }

  /**
   * Sleep for particular time.
   *
   * @param {number} ms: time in ms
   *
   * @returns {Promise<any>}
   */
  sleep(ms) {
    // eslint-disable-next-line no-console
    console.log(`Sleeping for ${ms} ms.`);

    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Parses ampersand delimited key value pairs and returns a hash of key value pairs.
   * Ex: [oauth_token=uEyX0AAAAAAA_NBNACBBa52afhY&oauth_token_secret=Mtwr1Dd3MAYLJ8yxJlJ69WIbsdKEjtnM&oauth_callback_confirmed=true]
   * Response:
   * {
   *    oauth_token: 'uEyX0AAAAAAA_NBNACBBa52afhY',
   *    oauth_token_secret: 'Mtwr1Dd3MAYLJ8yxJlJ69WIbsdKEjtnM',
   *    oauth_callback_confirmed: 'true'
   * }
   *
   * @param response
   */
  parseAmpersandSeparatedKeyValue(response) {
    const finalResponse = {};
    response.split('&amp;').forEach(function(keyValPair) {
      const val = keyValPair.split('=');
      finalResponse[val[0]] = val[1];
    });

    return finalResponse;
  }

  /**
   * Json parsed response from twitter.
   *
   * @return {Object}
   */
  parseTwitterJsonResponse(response) {
    return JSON.parse(response);
  }

  /**
   * Gives random alphanumeric string
   *
   * @returns {string}
   */
  getRandomAlphaNumericString() {
    return (
      Date.now()
        .toString(36)
        .substring(2, 15) +
      Math.random()
        .toString(36)
        .substring(2, 15)
    );
  }

  /**
   * Gives unique user name
   *
   * @param name
   * @returns {string}
   */
  getUniqueUserName(name) {
    return (
      name.substring(0, 4) +
      '_' +
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .substring(2, 4)
    );
  }
}

module.exports = new BasicHelper();
