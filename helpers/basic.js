const BigNumber = require('bignumber.js');

const rootPrefix = '..',
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  apiErrorConfig = require(rootPrefix + '/config/apiParams/apiErrorConfig'),
  v1ParamErrorConfig = require(rootPrefix + '/config/apiParams/v1/errorConfig'),
  adminParamErrorConfig = require(rootPrefix + '/config/apiParams/admin/errorConfig'),
  webParamErrorConfig = require(rootPrefix + '/config/apiParams/web/errorConfig'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  internalParamErrorConfig = require(rootPrefix + '/config/apiParams/internal/errorConfig');

/**
 * Class for basic helper.
 *
 * @class BasicHelper
 */
class BasicHelper {
  /**
   * Get unique array.
   *
   * @param {array} inputArray
   * @param {number} [limit]
   *
   * @returns {[]}
   */
  uniquate(inputArray, limit) {
    const uniqueMap = {},
      uniqueOrderedArray = [];
    let counter = 0;

    for (let index = 0; index < inputArray.length; index++) {
      const arrayElement = inputArray[index];
      if (!uniqueMap[arrayElement]) {
        counter++;
        uniqueMap[arrayElement] = 1;
        uniqueOrderedArray.push(arrayElement);
        if (counter === limit) {
          return uniqueOrderedArray;
        }
      }
    }

    return uniqueOrderedArray;
  }

  /**
   * Convert wei value to un wei (normal).
   *
   * @param {*} wei
   *
   * @return {BigNumber}
   */
  convertWeiToNormal(wei) {
    return this.convertToBigNumber(wei).div(this.convertToBigNumber(10).toPower(18));
  }

  /**
   * Convert normal value to wei.
   *
   * @param {*} num
   *
   * @returns {BigNumber}
   */
  convertToWei(num) {
    return this.convertToBigNumber(num).mul(this.convertToBigNumber(10).toPower(18));
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
      paramErrorConfig = dynamicErrorConfig
        ? Object.assign(dynamicErrorConfig, adminParamErrorConfig)
        : adminParamErrorConfig;
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
  commaSeparatedStrToArray(str) {
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
   * Check if environment is staging.
   *
   * @return {boolean}
   */
  isSandbox() {
    return coreConstants.environment === 'sandbox';
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
    logger.log(`Sleeping for ${ms} ms.`);

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

  /**
   * Get pepo amount for some amount in usd.
   *
   * @param {string} usdInOneOst
   * @param {string} amountUSD
   *
   * @returns {string}
   */
  getPepoAmountForUSD(usdInOneOst, amountUSD) {
    const oThis = this;

    const usdInOnePepo = oThis.getUSDAmountForPepo(usdInOneOst, '1'),
      pepoInOneUSD = oThis.convertToBigNumber(1).div(oThis.convertToBigNumber(usdInOnePepo)),
      totalPepoBn = oThis.convertToBigNumber(pepoInOneUSD).mul(oThis.convertToBigNumber(amountUSD));

    return oThis
      .convertToWei(totalPepoBn)
      .round(0)
      .toString(10);
  }

  /**
   * Get usd amount for some pepo amount.
   *
   * @param {string} usdInOneOst
   * @param {string} amountPepo
   *
   * @returns {string}
   */
  getUSDAmountForPepo(usdInOneOst, amountPepo) {
    const oThis = this;

    const pepoInOneOST = 1;

    const ostInOnePepo = oThis.convertToBigNumber(1).div(oThis.convertToBigNumber(pepoInOneOST)),
      usdInOnePepo = oThis.convertToBigNumber(ostInOnePepo).mul(oThis.convertToBigNumber(usdInOneOst)),
      totalUSDBn = oThis.convertToBigNumber(usdInOnePepo).mul(oThis.convertToBigNumber(amountPepo));

    return totalUSDBn.toString(10);
  }

  /**
   * Is twitter id rotated?
   *
   * @param {string} twitterId
   *
   * @returns {boolean}
   */
  isTwitterIdRotated(twitterId) {
    return twitterId[0] === '-';
  }

  /**
   * Get user profile url prefix for admin dashboard.
   *
   * @returns {string}
   */
  userProfilePrefixUrl() {
    return coreConstants.PA_DOMAIN + '/admin/user-profile';
  }

  /**
   * Get communities url prefix.
   *
   * @returns {string}
   */
  communitiesPrefixUrl() {
    return coreConstants.PA_DOMAIN + '/communities';
  }

  /**
   * Get reply conversation thread url prefix for admin dashboard.
   *
   * @returns {string}
   */
  replyConversationThreadUrlPrefix() {
    return coreConstants.PA_DOMAIN + '/admin/video-replies';
  }

  /**
   * Get timestamp in minutes to date till seconds.
   *
   * @param {number} unixTimestampInMinutes
   *
   * @returns {string}
   */
  timeStampInMinutesToDateTillSeconds(unixTimestampInMinutes) {
    const dateObject = new Date(unixTimestampInMinutes * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = dateObject.getFullYear();
    const month = months[dateObject.getMonth()];
    const date = dateObject.getDate();
    const hour = dateObject.getHours();
    const min = dateObject.getMinutes();
    const sec = dateObject.getSeconds();

    return date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
  }

  /**
   * Get timestamp in minutes to date.
   *
   * @param {number} unixTimestampInMinutes
   *
   * @returns {string}
   */
  timeStampInMinutesToDate(unixTimestampInMinutes) {
    const dateObject = new Date(unixTimestampInMinutes * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = dateObject.getFullYear();
    const month = months[dateObject.getMonth()];
    const date = dateObject.getDate();

    return date + ' ' + month + ' ' + year;
  }

  /**
   * Subtract arr2 from arr1
   * @param arr1
   * @param arr2
   * @returns {Array}
   */
  arrayDiff(arr1, arr2) {
    const diffArray = [],
      arrMap = {};

    for (let index = 0; index < arr1.length; index++) {
      arrMap[arr1[index]] = 1;
    }

    for (let index = 0; index < arr2.length; index++) {
      delete arrMap[arr2[index]];
    }

    for (const arrEle in arrMap) {
      diffArray.push(arrEle);
    }

    return diffArray;
  }

  /**
   * Filter search term.
   *
   * @param {string} searchTerm
   *
   * @returns {string|*}
   */
  filterSearchTerm(searchTerm) {
    if (searchTerm && (searchTerm[0] === '#' || searchTerm[0] === '@')) {
      return searchTerm.substr(1);
    }

    return searchTerm;
  }

  /**
   * This function converts given numbers to bignumber and adds them.
   *
   * @param {string/number} number1
   * @param {string/number} number2
   *
   * @returns {string}
   * @private
   */
  convertToBigNumberAndAdd(number1, number2) {
    const oThis = this;

    return oThis
      .convertToBigNumber(number1)
      .plus(oThis.convertToBigNumber(number2))
      .toString(10);
  }

  /**
   * Parse and regex replace processed links and user mention in slack payload
   *
   * @param payload
   * @returns {Object}
   */
  preprocessSlackPayload(params) {
    const oThis = this;

    if (typeof params === 'string') {
      params = params.replace(/<(http)([^>\s]*)>/gi, '$1$2');
      params = params.replace(/<mailto:([^>\|\s]*)\|+([^><\s]*)>/gi, '$1');
    } else if (typeof params === 'boolean' || typeof params === 'number' || params === null) {
      // Do nothing and return param as is.
    } else if (params instanceof Array) {
      for (const index in params) {
        params[index] = oThis.preprocessSlackPayload(params[index]);
      }
    } else if (params instanceof Object) {
      Object.keys(params).forEach(function(key) {
        params[key] = oThis.preprocessSlackPayload(params[key]);
      });
    } else if (!params) {
      // Do nothing and return param as is.
    } else {
      console.error('Invalid params type in payload: ', typeof params);
      params = '';
    }

    return params;
  }

  /**
   * Sort numbers array.
   *
   * @param numbers
   */
  sortNumbers(numbers) {
    return numbers.sort(function(a, b) {
      return a - b;
    });
  }
}

module.exports = new BasicHelper();
