const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  urlParser = require('url'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  transactionTypesConstants = require(rootPrefix + '/lib/globalConstant/transactionTypes');

/**
 * CommonValidator
 * @constructor
 */
class CommonValidator {
  constructor() {}

  /**
   * Validate page no
   *
   * @param pageNo
   * @return {Array<boolean, number>}
   */
  static validateAndSanitizePageNo(pageNo) {
    const oThis = this;

    if (oThis.isVarNullOrUndefined(pageNo)) {
      return [true, 1];
    }

    if (!pageNo) {
      return [false, 0];
    }

    if (isNaN(parseInt(pageNo))) {
      return [false, 0];
    }

    if (pageNo < 1 || pageNo > 1000) {
      return [false, 0];
    }

    if (parseInt(pageNo) != pageNo) {
      return [false, 0];
    }

    return [true, parseInt(pageNo)];
  }

  /**
   * Validate limit
   *
   * @param limit - limit passed in params
   * @param defaultLimit - default limit
   * @param minAllowedLimit - min allowed
   * @param maxAllowedLimit - max allowed
   *
   * @return {Array<boolean, number>}
   */
  static validateAndSanitizeLimit(limit, defaultLimit, minAllowedLimit, maxAllowedLimit) {
    const oThis = this;

    if (oThis.isVarNullOrUndefined(limit)) {
      return [true, defaultLimit];
    }

    if (!limit) {
      return [false, 0];
    }

    if (isNaN(parseInt(limit))) {
      return [false, 0];
    }

    if (limit < minAllowedLimit || limit > maxAllowedLimit) {
      return [false, 0];
    }

    if (parseInt(limit) != limit) {
      return [false, 0];
    }

    return [true, parseInt(limit)];
  }

  /**
   * Is valid Boolean?
   *
   * @return {Boolean}
   */
  static validateBoolean(str) {
    const oThis = this;

    if (oThis.isVarNullOrUndefined(str)) {
      return false;
    }
    return str === 'true' || str === 'false' || str === true || str === false;
  }

  /**
   * Is var a valid email?
   *
   * @param {String} variable
   *
   * @return {Boolean}
   */
  static isValidEmail(variable) {
    return (
      CommonValidator.validateString(variable) &&
      /^[A-Z0-9]+[A-Z0-9_%+-]*(\.[A-Z0-9_%+-]{1,})*@(?:[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?\.)+[A-Z]{2,24}$/i.test(variable)
    );
  }

  /**
   * Is var null or undefined?
   *
   * @param {Object/String/Integer/Boolean} variable
   *
   * @return {Boolean}
   */
  static isVarNullOrUndefined(variable) {
    return typeof variable === 'undefined' || variable == null;
  }

  /**
   * Is var null?
   *
   * @param variable
   *
   * @returns {boolean}
   */
  static isVarNull(variable) {
    return variable == null;
  }

  /**
   * Is var undefined?
   *
   * @param variable
   *
   * @returns {boolean}
   */
  static isVarUndefined(variable) {
    return typeof variable === 'undefined';
  }

  /**
   * Is var not blank or null
   *
   * @param {Array<string>} array
   *
   * @return {Boolean}
   */
  static validateNonBlankString(variable) {
    return CommonValidator.validateNonBlankStringArray([variable]);
  }
  /**
   * Is var not blank or null
   *
   * @param {Array<string>} array
   *
   * @return {Boolean}
   */
  static validateNonBlankStringArray(array) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; i++) {
        let variable = array[i];
        if (
          CommonValidator.isVarNullOrUndefined(variable) ||
          !CommonValidator.validateString(variable) ||
          variable == ''
        ) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * Is var null ?
   *
   * @return {Boolean}
   *
   */
  static isVarTrue(variable) {
    return variable === true || variable === 'true';
  }

  /**
   *
   * Is var null ?
   *
   * @return {Boolean}
   *
   */
  static isVarFalse(variable) {
    return variable === false || variable === 'false';
  }

  /**
   *
   * Is var integer ?
   *
   * @return {Boolean}
   *
   */
  static validateInteger(variable) {
    try {
      let variableInBn = new BigNumber(String(variable));
      // Variable is integer and its length is less than 37 digits
      if (variableInBn.isInteger() && variableInBn.toString(10).length <= 37) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Is integer non zero
   *
   * @param {String/Number} variable
   *
   * @return {boolean}
   */
  static validateNonZeroInteger(variable) {
    const oThis = this;

    if (oThis.validateInteger(variable)) {
      return Number(variable) > 0;
    }
    return false;
  }

  /**
   * Is integer non negative
   *
   * @param {String/Number} variable
   *
   * @return {boolean}
   */
  static validateNonNegativeInteger(variable) {
    const oThis = this;

    if (oThis.validateInteger(variable)) {
      return Number(variable) >= 0;
    }
    return false;
  }

  /**
   * Is integer zero
   *
   * @param {String/Number} variable
   *
   * @return {boolean}
   */
  static validateZeroInteger(variable) {
    const oThis = this;

    if (oThis.validateInteger(variable)) {
      return Number(variable) === 0;
    }
    return false;
  }

  /**
   * Is wei value greater than 0?
   *
   * @param {String/Number} variable
   *
   * @return {boolean}
   */
  static validateNonZeroWeiValue(variable) {
    try {
      let variableInStr = String(variable),
        variableInBn = new BigNumber(variableInStr),
        regexExpressionStr = '^[0-9]+$',
        regexExpressionObj = new RegExp(regexExpressionStr);

      // Variable in wei is integer and its length is less than 37 digits
      if (
        variableInBn.gt(new BigNumber('0')) &&
        variableInBn.isInteger() &&
        variableInBn.toString(10).length <= 37 &&
        regexExpressionObj.test(variableInStr)
      ) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Is wei value 0?
   *
   * @param {String/Number} variable
   *
   * @return {boolean}
   */
  static validateZeroWeiValue(variable) {
    try {
      let variableInBn = new BigNumber(String(variable));
      if (variableInBn.eq(new BigNumber('0')) && variableInBn.isInteger()) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Is string valid ?
   *
   * @return {Boolean}
   */
  static validateString(variable) {
    return typeof variable === 'string';
  }

  /**
   * Checks if the given string starts with 0x
   *
   * @param variable {String}
   *
   * @return {Boolean}
   */
  static validateHexString(variable) {
    const oThis = this;

    return /^0x[a-z0-9]{1,}$/i.test(variable);
  }

  /**
   *
   * Is var a string containing only alphabets ?
   *
   * @return {Boolean}
   *
   */
  static validateAlphaString(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }
    return /^[a-z]+$/i.test(variable);
  }

  /**
   *
   * Is var a string containing only alphabets ?
   *
   * @return {Boolean}
   *
   */
  static validateAlphaSpaceString(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }
    return /^[a-z\s]+$/i.test(variable);
  }

  /**
   *
   * Is var a string containing alpha numeric chars ?
   *
   * @return {Boolean}
   *
   */
  static validateAlphaNumericString(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }
    return /^[a-z0-9]+$/i.test(variable);
  }

  /**
   *
   * Is var a string containing alpha numeric chars ?
   *
   * @return {Boolean}
   *
   */
  static validateAlphaNumericCommonSpecialCharString(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }
    return /^[a-z0-9\_]+$/i.test(variable);
  }

  /**
   *
   * Is var a string containing alpha numeric chars ?
   *
   * @return {Boolean}
   *
   */
  static validateMaxLengthMediumString(variable) {
    return variable.length < 255;
  }

  /**
   *
   * Is var a string containing alpha numeric chars ?
   *
   * @return {Boolean}
   *
   */
  static validateOstTransactionMetaTextLength(variable) {
    return variable.length < 250;
  }

  /**
   *
   * Is var a valid Password String ?
   *
   * @return {Boolean}
   *
   */
  static validatePassword(variable) {
    return variable.length <= 40 && variable.length >= 8;
  }

  /**
   *
   * Is var a a valid UserName String ?
   *
   * @return {Boolean}
   *
   */
  static validateUserName(variable) {
    return (
      CommonValidator.validateAlphaNumericCommonSpecialCharString(variable) &&
      variable.length <= 15 &&
      variable.length >= 1
    );
  }

  /**
   *
   * Is var a a valid Name String ?
   *
   * @return {Boolean}
   *
   */
  static validateName(variable) {
    let sanitizedVariable = variable.trim();
    return (
      CommonValidator.validateAlphaSpaceString(sanitizedVariable) &&
      variable.length <= 25 &&
      sanitizedVariable.length >= 2
    );
  }

  /**
   *
   * Is valid Boolean
   *
   * @return {Boolean}
   *
   */
  static validateOrderingString(str) {
    return ['asc', 'desc'].includes(str.toLowerCase());
  }

  /**
   * Is valid Integer Array
   *
   * @param {Array} array
   *
   * @return {Boolean}
   */
  static validateIntegerArray(array) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; i++) {
        if (!CommonValidator.validateInteger(array[i])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Is valid non zero integer Array
   *
   * @param {Array} array
   *
   * @return {Boolean}
   */
  static validateNonZeroIntegerArray(array) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; i++) {
        if (!CommonValidator.validateNonZeroInteger(array[i])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Is valid Array containing gte 0 wei values as string
   *
   * @param {Array} array
   *
   * @return {Boolean}
   */
  static validateWeiAmountArray(array) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; i++) {
        let variable = array[i];
        if (typeof variable !== 'string' || !CommonValidator.validateNonZeroWeiValue(variable)) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Is valid UUID V4 Array
   *
   * @param {Array} array
   *
   * @return {Boolean}
   */
  static validateUuidV4Array(array) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; i++) {
        if (!CommonValidator.validateUuidV4(array[i])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Is valid eth address Array
   *
   * @param {Array} array
   *
   * @return {Boolean}
   */
  static validateEthAddressArray(array) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; i++) {
        if (!CommonValidator.validateEthAddress(array[i])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   *  This function validates array.
   *
   */
  static validateArray(array) {
    return Array.isArray(array);
  }

  /**
   * Checks if the given string is an address
   *
   * @param address {String} address the given HEX address
   *
   * @return {Boolean}
   */
  static validateEthAddress(address) {
    const oThis = this;

    if (oThis.isVarNullOrUndefined(address) || typeof address !== 'string' || address == '') {
      return false;
    }

    address = address.toLowerCase();

    return /^0x[0-9a-f]{40}$/i.test(address);
  }

  /**
   * Checks if address is zero eth address or not
   *
   * @param address {String} address the given HEX address
   *
   * @return {Boolean}
   */
  static validateZeroEthAddress(address) {
    if (CommonValidator.validateEthAddress(address)) {
      return /^0x[0]{40}$/i.test(address);
    }
    return false;
  }

  /**
   * Check uuid v4 validation.
   *
   * @param {String} uuid
   *
   * @returns {Boolean}
   */
  static validateUuidV4(uuid) {
    const oThis = this;

    if (!oThis.isVarNullOrUndefined(uuid) && typeof uuid === 'string') {
      return /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(uuid);
    }

    return false;
  }

  /**
   * Check if transaction hash is valid or not
   *
   * @param {String} transactionHash - Transaction hash
   *
   * @return {Boolean}
   */
  static validateTransactionHash(transactionHash) {
    const oThis = this;

    if (!oThis.isVarNullOrUndefined(transactionHash) && typeof transactionHash === 'string') {
      return /^0x[0-9a-fA-F]{64}$/.test(transactionHash);
    }

    return false;
  }

  /**
   * Check if personal sign api key is valid or not
   *
   * @param {string} variable - personal sign api key
   * @param {string} separator - personal sign api key separator
   *
   * @return {boolean}
   */
  static validatePersonalSignApiKey(variable, separator) {
    const oThis = this;

    if (typeof variable !== 'string') {
      return false;
    }

    if (!oThis.isVarNullOrUndefined(variable) && typeof variable === 'string') {
      let api_key_addresses = variable.split(separator);

      // Invalid token id
      let api_token_id = api_key_addresses[0];
      if (!api_token_id || !oThis.validateNonZeroInteger(api_token_id)) {
        return false;
      }

      // Invalid user id
      let api_user_id = api_key_addresses[1];
      if (!api_user_id || !oThis.validateUuidV4(api_user_id)) {
        return false;
      }

      // Invalid device address
      let api_device_address = api_key_addresses[2];
      if (!api_device_address || !oThis.validateEthAddress(api_device_address)) {
        return false;
      }

      // Invalid api personal signer address
      let api_personal_signer_address = api_key_addresses[3];
      if (!api_personal_signer_address || !oThis.validateEthAddress(api_personal_signer_address)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if personal sign is valid or not
   *
   * @param {string} variable - personal sign
   *
   * @return {boolean}
   */
  static validatePersonalSign(variable) {
    const oThis = this;

    if (!oThis.isVarNullOrUndefined(variable) && typeof variable === 'string') {
      return /^0x[0-9a-fA-F]{130}$/.test(variable);
    }

    return false;
  }

  /**
   * Check if timestamp
   *
   * @param {string} variable - variable
   *
   * @return {boolean}
   */
  static validateTimestamp(variable) {
    if (!CommonValidator.validateInteger(variable)) {
      return false;
    }

    return /^[0-9]{10}$/.test(variable);
  }

  /**
   * Check if variable is object and non-empty.
   *
   * @param {object} variable
   *
   * @return {boolean}
   */
  static validateNonEmptyObject(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable) || typeof variable !== 'object') {
      return false;
    }

    for (const prop in variable) {
      try {
        if (Object.prototype.hasOwnProperty.call(variable, prop)) {
          return true;
        }
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  /**
   * Validate object.
   *
   * @param {object} variable
   *
   * @returns {boolean}
   */
  static validateObject(variable) {
    return !(CommonValidator.isVarNullOrUndefined(variable) || typeof variable !== 'object');
  }

  /**
   * Check if variable is valid user kind string
   *
   * @param {string} variable
   *
   * @return {boolean}
   */
  static validatePasswordString(variable) {
    if (!CommonValidator.validateAlphaNumericString(variable)) {
      return false;
    }
    return true;
  }

  /**
   * Validate API validateTransactionStatusArray
   *
   * @param Array<string> array
   *
   * @return {boolean}
   */
  static validateStringArray(array) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; i++) {
        if (!CommonValidator.validateString(array[i])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Validate pagination identifier.
   *
   * @param {Object} key - params.meta
   *
   * @return {Boolean}
   */
  static validatePaginationIdentifier(key) {
    try {
      const paginationParams = basicHelper.decryptPageIdentifier(key);
      return CommonValidator.validateNextPagePayload(paginationParams);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validates notification id
   *
   * @param notificationId
   * @return {boolean}
   */
  static validateNotificationId(notificationId) {
    try {
      const notificationIdParams = basicHelper.decryptPageIdentifier(notificationId);
      return CommonValidator.validateNotificationIdParams(notificationIdParams);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validates notification id params
   *
   * @param notificationIdParams
   * @return {boolean}
   */
  static validateNotificationIdParams(notificationIdParams) {
    let notValid = false;

    if (
      !CommonValidator.validateNonZeroInteger(notificationIdParams.user_id) &&
      !CommonValidator.validateNonZeroInteger(notificationIdParams.last_action_timestamp) &&
      !CommonValidator.validateUuidV4(notificationIdParams.uuid)
    ) {
      notValid = true;
    }

    return !notValid;
  }

  /**
   * Validate next page payload
   *
   * @param variable
   * @param {Object} [variable.limit]
   * @param {String} [variable.page]
   * @param {String} [variable.pagination_timestamp]
   *
   * @returns {boolean}
   */
  static validateNextPagePayload(variable) {
    let notValid = false;

    if (!CommonValidator.validateNonEmptyObject(variable)) {
      return false;
    }

    if (variable.page) {
      notValid = notValid || !CommonValidator.validateNonZeroInteger(variable.page);
    }
    if (variable.pagination_timestamp) {
      notValid = notValid || !CommonValidator.validateNonZeroInteger(variable.pagination_timestamp);
    }

    if (variable.page_state) {
      notValid = notValid || !CommonValidator.validateString(variable.page_state);
    }

    return !notValid;
  }

  /**
   * Validate ost transaction meta
   *
   * @param variable
   * @returns {boolean}
   */
  static validateOstTransactionMeta(variable) {
    let notValid = false;

    if (variable.vi) {
      notValid = notValid || !CommonValidator.validateNonZeroInteger(variable.vi);
    }

    if (variable.text) {
      notValid = notValid || !CommonValidator.validateOstTransactionMetaText(variable.text);
    }
    if (variable.giphy) {
      notValid = notValid || !CommonValidator.validateOstTransactionMetaGiphy(variable.giphy);
    }

    if (notValid) {
      logger.debug('InvalidOstTransactionMeta======', variable);
    }

    return !notValid;
  }

  static validateOstTransactionMetaText(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return true;
    }

    return CommonValidator.validateString(variable) && CommonValidator.validateOstTransactionMetaTextLength(variable);
  }

  static validateOstTransactionMetaGiphy(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return true;
    }

    const id = variable.id,
      kind = variable.kind,
      downsized = variable.downsized,
      fixedHeight = variable.fixed_height,
      fixedHeightDownsampled = variable.fixed_height_downsampled,
      fixedWidth = variable.fixed_width,
      fixedWidthDownsampled = variable.fixed_width_downsampled,
      original = variable.original,
      previewGif = variable.preview_gif,
      previewWebp = variable.preview_webp,
      tags = variable.tags;

    if (
      CommonValidator.isVarNullOrUndefined(id) ||
      CommonValidator.isVarNullOrUndefined(kind) ||
      CommonValidator.isVarNullOrUndefined(downsized) ||
      CommonValidator.isVarNullOrUndefined(fixedHeight) ||
      CommonValidator.isVarNullOrUndefined(fixedHeightDownsampled) ||
      CommonValidator.isVarNullOrUndefined(fixedWidth) ||
      CommonValidator.isVarNullOrUndefined(fixedWidthDownsampled) ||
      CommonValidator.isVarNullOrUndefined(original) ||
      CommonValidator.isVarNullOrUndefined(previewGif)
    ) {
      return false;
    }

    if (!CommonValidator.validateString(id) || kind !== 'gif') {
      return false;
    }

    if (
      !CommonValidator.validateOstTransactionMetaGiphySizeData(downsized) ||
      !CommonValidator.validateOstTransactionMetaGiphySizeData(fixedHeight) ||
      !CommonValidator.validateOstTransactionMetaGiphySizeData(fixedHeightDownsampled) ||
      !CommonValidator.validateOstTransactionMetaGiphySizeData(fixedWidth) ||
      !CommonValidator.validateOstTransactionMetaGiphySizeData(fixedWidthDownsampled) ||
      !CommonValidator.validateOstTransactionMetaGiphySizeData(original) ||
      !CommonValidator.validateOstTransactionMetaGiphySizeData(previewGif)
    ) {
      return false;
    }

    return true;
  }

  static validateOstTransactionMetaGiphySizeData(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }

    const media_id = variable.media_id,
      rendition_type = variable.rendition_type,
      url = variable.url,
      width = variable.width,
      height = variable.height,
      size = variable.size,
      frames = variable.frames,
      mp4 = variable.mp4,
      mp4_size = variable.mp4_size,
      webp = variable.webp,
      webp_size = variable.webp_size;

    if (
      !CommonValidator.validateNonBlankStringArray([media_id, rendition_type, url]) ||
      !CommonValidator.validateNonZeroIntegerArray([width, height, size]) ||
      !CommonValidator.validateGiphyUrl(url) ||
      (!CommonValidator.isVarNullOrUndefined(frames) && !CommonValidator.validateNonNegativeInteger(frames)) ||
      !CommonValidator.validateGiphyUrl(mp4) ||
      (!CommonValidator.isVarNullOrUndefined(mp4_size) && !CommonValidator.validateNonNegativeInteger(mp4_size)) ||
      !CommonValidator.validateGiphyUrl(webp) ||
      (!CommonValidator.isVarNullOrUndefined(webp_size) && !CommonValidator.validateNonNegativeInteger(webp_size))
    ) {
      return false;
    }

    return true;
  }

  static validateGiphyUrl(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return true;
    }

    if (!CommonValidator.validateString(variable)) {
      return false;
    }

    const URL = urlParser.URL;

    try {
      let obj = new URL(variable);
      return /^media[a-z0-9]*\.giphy\.com$/i.test(obj.host);
    } catch (err) {
      return false;
    }
  }

  /**
   * Validate Transaction object
   *
   * @param {Object} variable
   *
   * @return {boolean}
   */
  static validateOstTransactionObject(variable) {
    if (!CommonValidator.validateUuidV4(variable.id)) {
      return false;
    }

    if (!CommonValidator.isVarNullOrUndefined(variable.transaction_hash)) {
      if (!CommonValidator.validateTransactionHash(variable.transaction_hash)) {
        return false;
      }
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.from)) {
      //null is allowed for some of the parameters.
      if (!CommonValidator.validateEthAddress(variable.from)) {
        return false;
      }
    }
    if (!CommonValidator.validateEthAddress(variable.to)) {
      return false;
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.nonce)) {
      if (!CommonValidator.validateInteger(variable.nonce)) {
        return false;
      }
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.value)) {
      if (!CommonValidator.validateString(variable.value)) {
        return false;
      }
    }
    if (!CommonValidator.validateNonZeroWeiValue(variable.gas_price)) {
      return false;
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.gas_used)) {
      if (!CommonValidator.validateInteger(variable.gas_used)) {
        return false;
      }
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.transaction_fee)) {
      if (!CommonValidator.validateNonZeroWeiValue(variable.transaction_fee)) {
        return false;
      }
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.block_confirmation)) {
      if (!CommonValidator.validateInteger(variable.block_confirmation)) {
        return false;
      }
    }
    if (!CommonValidator.validateString(variable.status)) {
      return false;
    }
    if (!CommonValidator.validateNonZeroInteger(variable.updated_timestamp)) {
      return false;
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.block_timestamp)) {
      if (!CommonValidator.validateNonZeroInteger(variable.block_timestamp)) {
        return false;
      }
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.block_number)) {
      if (!CommonValidator.validateNonZeroInteger(variable.block_number)) {
        return false;
      }
    }
    if (!CommonValidator.isVarNullOrUndefined(variable.rule_name)) {
      if (!CommonValidator.validateString(variable.rule_name)) {
        return false;
      }
    }
    if (!CommonValidator.validateMetaProperty(variable.meta_property)) {
      return false;
    }
    if (!CommonValidator.validateTransfersArray(variable.transfers)) {
      return false;
    }

    return true;
  }

  /**
   * Validate Meta Properties while intsertion
   *
   * @param {Object} object
   *
   * @return {boolean}
   */
  static validateMetaProperty(object) {
    if (CommonValidator.isVarNullOrUndefined(object) || typeof object !== 'object') {
      return false;
    }

    let whitelistedKeysMap = { name: 1, type: 1, details: 1 };

    for (let key in object) {
      if (!whitelistedKeysMap[key]) {
        delete object[key];
      }
    }

    let whitelistedTypeMap = {
      [transactionTypesConstants.companyToUserTransactionType]: 1,
      [transactionTypesConstants.userToUserTransactionType]: 1,
      [transactionTypesConstants.userToCompanyTransactionType]: 1
    };

    if (Object.prototype.hasOwnProperty.call(object, 'type') && !whitelistedTypeMap[object['type']]) {
      return false;
    }

    // NOTE: Here we are not checking length of meta property string. For backward compatibility in future.
    if (
      Object.prototype.hasOwnProperty.call(object, 'name') &&
      !CommonValidator.validateMetaPropertyName(object['name'])
    ) {
      return false;
    }

    // NOTE: Here we are not checking length of meta property string. For backward compatibility in future.
    if (
      Object.prototype.hasOwnProperty.call(object, 'details') &&
      !CommonValidator.validateMetaPropertyDetails(object['details'])
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validate Transfers in transaction entity
   *
   * @param {Object} variable
   *
   * @return {boolean}
   */
  static validateTransfersArray(variable) {
    if (!CommonValidator.validateArray(variable)) {
      return false;
    }

    for (let index = 0; index < variable.length; index++) {
      if (!CommonValidator.validateTransferObject(variable[index])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate Transfer Object
   *
   * @param {Object} variable
   *
   * @return {boolean}
   */
  static validateTransferObject(variable) {
    if (!CommonValidator.validateNonEmptyObject(variable)) {
      return false;
    }

    if (!CommonValidator.validateEthAddress(variable.from) || !CommonValidator.validateEthAddress(variable.to)) {
      return false;
    }
    if (
      !CommonValidator.validateUuidV4(variable.from_user_id) ||
      !CommonValidator.validateUuidV4(variable.to_user_id)
    ) {
      return false;
    }
    if (!CommonValidator.validateNonZeroWeiValue(variable.amount)) {
      return false;
    }
    if (!CommonValidator.validateString(variable.kind)) {
      return false;
    }
    return true;
  }

  /**
   *
   * check if meta property name is valid
   *
   * @param name
   *
   * @return {boolean}
   */
  static validateMetaPropertyName(name) {
    if (CommonValidator.isVarNull(name)) return true;

    if (CommonValidator.isVarUndefined(name)) return false;

    if (name.length > 25) return false;

    if (typeof name !== 'string') {
      return false;
    }
    return /^[0-9a-z\s\-_]{1,}$/i.test(name);
  }

  /**
   *
   * check if meta property details is valid
   *
   * @param details
   * @return {boolean}
   */
  static validateMetaPropertyDetails(details) {
    if (CommonValidator.isVarNull(details)) return true;

    if (CommonValidator.isVarUndefined(details)) return false;

    if (details.length > 125) return false;

    if (typeof details !== 'string') {
      return false;
    }
    return /^[0-9a-z\s\-_]{1,}$/i.test(details);
  }

  /**
   * Validates a website url is correctly formed
   *
   * @param details
   * @return {boolean}
   */
  static validateGenericUrl(details) {
    if (details == '') {
      return true;
    }

    if (!CommonValidator.validateString(details)) {
      return false;
    }

    return /^(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)*/i.test(
      details
    );
  }

  /**
   * Validates a website url is correctly formed
   * NOTE: - checks for 'http' mandatorily.
   *
   * @param details
   * @return {boolean}
   */
  static validateHttpBasedUrl(details) {
    if (CommonValidator.isVarNullOrUndefined(details)) {
      return false;
    }

    if (!CommonValidator.validateString(details)) {
      return false;
    }

    const URL = urlParser.URL;

    try {
      let obj = new URL(details);

      return /^http([s]?):\/\/\w+(-\w+)*\.\w[^\r\n\s]*/i.test(obj.href);
    } catch (err) {
      return false;
    }
  }

  /**
   * Sanitize text
   *  1] removes 3 or more than 3 consecutive new lines
   *  2] trims white spaces
   *
   * @param variable
   */
  static sanitizeText(variable) {
    if (!CommonValidator.validateString(variable)) {
      return false;
    }

    //return variable.replace(/[\r\n]+/g, '');
    return variable.replace(/\n{3,}/g, '').trim();
  }
}

module.exports = CommonValidator;
