const urlParser = require('url'),
  BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionTypesConstants = require(rootPrefix + '/lib/globalConstant/transactionTypes');

/**
 * Class for common validators.
 *
 * @class CommonValidator
 */
class CommonValidator {
  /**
   * Validate page no.
   *
   * @param {string/number} pageNo
   *
   * @returns {array<boolean, number>}
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
   * @param limit: limit passed in params
   * @param defaultLimit: default limit
   * @param minAllowedLimit: min allowed
   * @param maxAllowedLimit: max allowed
   *
   * @returns {array<boolean, number>}
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
   * @returns {boolean}
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
   * @param {string} variable
   *
   * @returns {boolean}
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
   * @param {object/string/integer/boolean} variable
   *
   * @returns {boolean}
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
   * Is var not blank or null?
   *
   * @param {array<string>} variable
   *
   * @returns {boolean}
   */
  static validateNonBlankString(variable) {
    return CommonValidator.validateNonBlankStringArray([variable]);
  }

  /**
   * Is var not blank or null
   *
   * @param {array<string>} array
   *
   * @returns {boolean}
   */
  static validateNonBlankStringArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        const variable = array[index];
        if (
          CommonValidator.isVarNullOrUndefined(variable) ||
          !CommonValidator.validateString(variable) ||
          variable == ''
        ) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Is var true?
   *
   * @returns {boolean}
   */
  static isVarTrue(variable) {
    return variable === true || variable === 'true';
  }

  /**
   * Is var false?
   *
   * @returns {boolean}
   */
  static isVarFalse(variable) {
    return variable === false || variable === 'false';
  }

  /**
   * Is var integer?
   *
   * @returns {boolean}
   */
  static validateInteger(variable) {
    try {
      const variableInBn = new BigNumber(String(variable));
      // Variable is integer and its length is less than 37 digits
      if (variableInBn.isInteger() && variableInBn.toString(10).length <= 37) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Is integer non zero?
   *
   * @param {string/number} variable
   *
   * @returns {boolean}
   */
  static validateNonZeroInteger(variable) {
    const oThis = this;

    if (oThis.validateInteger(variable)) {
      return Number(variable) > 0;
    }

    return false;
  }

  /**
   * Check if number is non negative
   *
   * @param variable
   * @returns {boolean}
   */
  static validateNonNegativeNumber(variable) {
    const oThis = this;

    return Number(variable) > 0;
  }

  /**
   * Is integer non negative
   *
   * @param {string/number} variable
   *
   * @returns {boolean}
   */
  static validateNonNegativeInteger(variable) {
    const oThis = this;

    if (oThis.validateInteger(variable)) {
      return Number(variable) >= 0;
    }

    return false;
  }

  /**
   * Is integer zero?
   *
   * @param {string/number} variable
   *
   * @returns {boolean}
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
   * @param {string/number} variable
   *
   * @returns {boolean}
   */
  static validateNonZeroWeiValue(variable) {
    try {
      const variableInStr = String(variable),
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
   * @param {string/number} variable
   *
   * @returns {boolean}
   */
  static validateZeroWeiValue(variable) {
    try {
      const variableInBn = new BigNumber(String(variable));
      if (variableInBn.eq(new BigNumber('0')) && variableInBn.isInteger()) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Is number wei?
   *
   * @param {string/number} variable
   *
   * @returns {boolean}
   */
  static validateIntegerWeiValue(variable) {
    if (CommonValidator.validateZeroWeiValue(variable) || CommonValidator.validateNonZeroWeiValue(variable)) {
      const perReplyAmount = basicHelper.convertWeiToNormal(variable);

      if (CommonValidator.validateInteger(perReplyAmount.toString(10))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Is string valid ?
   *
   * @returns {boolean}
   */
  static validateString(variable) {
    return typeof variable === 'string';
  }

  /**
   * Is video description valid ?
   *
   * @param videoDescription
   * @returns {boolean}
   */
  static validateVideoDescription(videoDescription) {
    return typeof videoDescription === 'string' && videoDescription.length <= 200;
  }

  /**
   * Is channel description valid ?
   *
   * @param {string} channelDescription
   *
   * @returns {boolean}
   */
  static validateChannelDescription(channelDescription) {
    return typeof channelDescription === 'string' && channelDescription.length <= 200;
  }

  /**
   * Is channel tagline valid ?
   *
   * @param {string} channelTagline
   *
   * @returns {boolean}
   */
  static validateChannelTagline(channelTagline) {
    return typeof channelTagline === 'string' && channelTagline.length <= 200;
  }

  /**
   * Checks if the given string starts with 0x.
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateHexString(variable) {
    return /^0x[a-z0-9]{1,}$/i.test(variable);
  }

  /**
   * Is var a string containing only alphabets?
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateAlphaString(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }

    return /^[a-z]+$/i.test(variable);
  }

  /**
   * Is var a string containing alpha numeric chars?
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateAlphaNumericString(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }

    return /^[a-z0-9]+$/i.test(variable);
  }

  /**
   * Is var a valid invite code
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateInviteCode(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }

    return /^[a-z0-9]{1,25}$/i.test(variable);
  }

  /**
   * Is var a string containing alpha numeric chars ?
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateAlphaNumericCommonSpecialCharString(variable) {
    if (CommonValidator.isVarNullOrUndefined(variable)) {
      return false;
    }

    return /^[a-z0-9\_]+$/i.test(variable);
  }

  /**
   * Is var a string containing alpha numeric chars?
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateMaxLengthMediumString(variable) {
    return variable.length < 255;
  }

  /**
   * Is var a string containing alpha numeric chars?
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateOstTransactionMetaTextLength(variable) {
    return variable.length < 250;
  }

  /**
   * Is var a valid password string?
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validatePassword(variable) {
    return variable.length <= 40 && variable.length >= 8;
  }

  /**
   * Is var a a valid UserName string?
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateUserName(variable) {
    return (
      CommonValidator.validateAlphaNumericCommonSpecialCharString(variable) &&
      variable.length <= 15 &&
      variable.length >= 1
    );
  }

  /**
   * Is var a a valid name string?
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateName(variable) {
    const sanitizedVariable = variable.trim();

    return variable.length <= userConstants.nameLengthMaxLimit && sanitizedVariable.length >= 2;
  }

  /**
   * Is string ordering?
   *
   * @param {string} str
   *
   * @returns {boolean}
   */
  static validateOrderingString(str) {
    return ['asc', 'desc'].includes(str.toLowerCase());
  }

  /**
   * Is valid integer array?
   *
   * @param {array} array
   *
   * @returns {boolean}
   */
  static validateIntegerArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateInteger(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Is valid non zero integer array?
   *
   * @param {array} array
   *
   * @returns {boolean}
   */
  static validateNonZeroIntegerArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateNonZeroInteger(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Validate alpha numeric string array.
   *
   * @param {array} array
   *
   * @return {boolean}
   */
  static validateAlphaNumericStringArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateAlphaNumericString(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Is valid array containing gte 0 wei values as string?
   *
   * @param {array} array
   *
   * @returns {boolean}
   */
  static validateWeiAmountArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        const variable = array[index];
        if (typeof variable !== 'string' || !CommonValidator.validateNonZeroWeiValue(variable)) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Is valid UUIDv4 array?
   *
   * @param {array} array
   *
   * @returns {boolean}
   */
  static validateUuidV4Array(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateUuidV4(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Is valid eth address array?
   *
   * @param {array} array
   *
   * @returns {boolean}
   */
  static validateEthAddressArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateEthAddress(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   *  Is valid array?
   *
   *  @param {array} array
   *
   *  @returns {boolean}
   */
  static validateArray(array) {
    return Array.isArray(array);
  }

  /**
   *  Is valid non-empty array?
   *
   *  @param {array} array
   *
   *  @returns {boolean}
   */
  static validateNonEmptyArray(array) {
    return Array.isArray(array) && array.length > 0;
  }

  /**
   *  Is valid non-empty string array?
   *
   *  @param {array} array
   *
   *  @returns {boolean}
   */
  static validateNonEmptyStringArray(array) {
    const oThis = this;

    if (oThis.validateNonEmptyArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (typeof array[index] !== 'string') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Checks if the given string is an address
   *
   * @param {string} address: address the given HEX address
   *
   * @returns {boolean}
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
   * Checks if address is zero eth address or not?
   *
   * @param {string} address: address the given HEX address
   *
   * @returns {boolean}
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
   * @param {string} uuid
   *
   * @returns {boolean}
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
   * @param {string} transactionHash: Transaction hash
   *
   * @returns {boolean}
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
   * @param {string} variable: personal sign api key
   * @param {string} separator:- personal sign api key separator
   *
   * @returns {boolean}
   */
  static validatePersonalSignApiKey(variable, separator) {
    const oThis = this;

    if (typeof variable !== 'string') {
      return false;
    }

    if (!oThis.isVarNullOrUndefined(variable) && typeof variable === 'string') {
      const api_key_addresses = variable.split(separator);

      // Invalid token id
      const api_token_id = api_key_addresses[0];
      if (!api_token_id || !oThis.validateNonZeroInteger(api_token_id)) {
        return false;
      }

      // Invalid user id
      const api_user_id = api_key_addresses[1];
      if (!api_user_id || !oThis.validateUuidV4(api_user_id)) {
        return false;
      }

      // Invalid device address
      const api_device_address = api_key_addresses[2];
      if (!api_device_address || !oThis.validateEthAddress(api_device_address)) {
        return false;
      }

      // Invalid api personal signer address
      const api_personal_signer_address = api_key_addresses[3];
      if (!api_personal_signer_address || !oThis.validateEthAddress(api_personal_signer_address)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if personal sign is valid or not.
   *
   * @param {string} variable: personal sign
   *
   * @returns {boolean}
   */
  static validatePersonalSign(variable) {
    const oThis = this;

    if (!oThis.isVarNullOrUndefined(variable) && typeof variable === 'string') {
      return /^0x[0-9a-fA-F]{130}$/.test(variable);
    }

    return false;
  }

  /**
   * Check if timestamp is valid or not.
   *
   * @param {string} variable: variable
   *
   * @returns {boolean}
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
   * @returns {boolean}
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
   * @returns {boolean}
   */
  static validatePasswordString(variable) {
    return CommonValidator.validateAlphaNumericString(variable);
  }

  /**
   * Validate API validateTransactionStatusArray
   *
   * @param {array<string>} array
   *
   * @returns {boolean}
   */
  static validateStringArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateString(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  static validateStringifiedVideoUrls(variable) {
    if (CommonValidator.validateNonEmptyString(variable)) {
      const parsedArray = JSON.parse(variable);

      return CommonValidator.validateHashArray(parsedArray);
    }

    return false;
  }

  /**
   * Validate non-empty string.
   *
   * @param {string} variable
   *
   * @returns {boolean}
   */
  static validateNonEmptyString(variable) {
    return !!(CommonValidator.validateString && variable && variable.length !== 0);
  }

  /**
   * Validate hash array.
   *
   * @param {array<string>} array
   *
   * @returns {boolean}
   */
  static validateHashArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateNonEmptyObject(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Validate pagination identifier.
   *
   * @param {object} key: params.meta
   *
   * @returns {boolean}
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
   * Validates notification id.
   *
   * @param notificationId
   *
   * @returns {boolean}
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
   * Validates notification id params.
   *
   * @param {object} notificationIdParams
   *
   * @returns {boolean}
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
   * Validate next page payload.
   *
   * @param {object} variable
   * @param {object} [variable.limit]
   * @param {string} [variable.page]
   * @param {string} [variable.pagination_timestamp]
   * @param {number} [variable.filter_by_tag_id]
   * @param {string} [variable.page_state]
   * @param {number} [variable.pagination_id]
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

    if (variable.pagination_id) {
      notValid = notValid || !CommonValidator.validateNonZeroInteger(variable.pagination_id);
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

  /**
   * Validate transaction object.
   *
   * @param {object} variable
   *
   * @returns {boolean}
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
      // Null is allowed for some of the parameters.
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
   * Validate meta properties while insertion.
   *
   * @param {object} object
   *
   * @returns {boolean}
   */
  static validateMetaProperty(object) {
    if (CommonValidator.isVarNullOrUndefined(object) || typeof object !== 'object') {
      return false;
    }

    const whitelistedKeysMap = { name: 1, type: 1, details: 1 };

    for (const key in object) {
      if (!whitelistedKeysMap[key]) {
        delete object[key];
      }
    }

    const whitelistedTypeMap = {
      [transactionTypesConstants.companyToUserTransactionType]: 1,
      [transactionTypesConstants.userToUserTransactionType]: 1,
      [transactionTypesConstants.userToCompanyTransactionType]: 1
    };

    if (Object.prototype.hasOwnProperty.call(object, 'type') && !whitelistedTypeMap[object.type]) {
      return false;
    }

    // NOTE: Here we are not checking length of meta property string. For backward compatibility in future.
    if (
      Object.prototype.hasOwnProperty.call(object, 'name') &&
      !CommonValidator.validateMetaPropertyName(object.name)
    ) {
      return false;
    }

    // NOTE: Here we are not checking length of meta property string. For backward compatibility in future.
    if (
      Object.prototype.hasOwnProperty.call(object, 'details') &&
      !CommonValidator.validateMetaPropertyDetails(object.details)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validate transfers in transaction entity.
   *
   * @param {object} variable
   *
   * @returns {boolean}
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
   * Validate transfer object.
   *
   * @param {object} variable
   *
   * @returns {boolean}
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
   * Check if meta property name is valid.
   *
   * @param {string} name
   *
   * @returns {boolean}
   */
  static validateMetaPropertyName(name) {
    if (CommonValidator.isVarNull(name)) {
      return true;
    }

    if (CommonValidator.isVarUndefined(name)) {
      return false;
    }

    if (name.length > 25) {
      return false;
    }

    if (typeof name !== 'string') {
      return false;
    }

    return /^[0-9a-z\s\-_]{1,}$/i.test(name);
  }

  /**
   *
   * Check if meta property details is valid.
   *
   * @param {string} details
   *
   * @returns {boolean}
   */
  static validateMetaPropertyDetails(details) {
    if (CommonValidator.isVarNull(details)) {
      return true;
    }

    if (CommonValidator.isVarUndefined(details)) {
      return false;
    }

    if (details.length > 125) {
      return false;
    }

    if (typeof details !== 'string') {
      return false;
    }

    return /^[0-9a-z\s\.\-_]{1,}$/i.test(details);
  }

  /**
   * Validates a website url is correctly formed
   *
   * @param url
   * @returns {boolean}
   */
  static validateGenericUrl(url) {
    if (url == '') {
      return true;
    }

    if (!CommonValidator.validateString(url)) {
      return false;
    }

    return /^(http(s)?:\/\/)?([a-zA-Z0-9-_@:%+~#=]{1,256}\.)+[a-z]{2,15}\b([a-zA-Z0-9@:%_+.\[\]\-{}!'",~#?&;/=*]*)$/i.test(
      url
    );
  }

  /**
   * Validates a website url is correctly formed
   *
   * @param url
   * @returns {boolean}
   */
  static validateNonEmptyUrl(url) {
    if (url == '') {
      return false;
    }

    return CommonValidator.validateGenericUrl(url);
  }

  /**
   * Validates null or string.
   *
   * @param string
   * @returns {boolean}
   */
  static validateNullString(string) {
    if (CommonValidator.isVarNull(string)) {
      return true;
    }

    return CommonValidator.validateString(string);
  }

  /**
   * Validates a website url is correctly formed
   * NOTE: - checks for 'http' mandatorily.
   *
   * @param details
   * @returns {boolean}
   */
  static validateHttpBasedUrl(details) {
    if (details == '') {
      return true;
    }

    return CommonValidator.validateNonEmptyHttpBasedUrl(details);
  }

  /**
   * Validates a website url is correctly formed.
   * NOTE: - checks for 'http' mandatorily.
   *
   * @param details
   * @returns {boolean}
   */
  static validateNonEmptyHttpBasedUrl(details) {
    if (!CommonValidator.validateString(details)) {
      return false;
    }

    return /^http(s)?:\/\/([a-zA-Z0-9-_@:%+~#=]{1,256}\.)+[a-z]{2,15}\b([a-zA-Z0-9@:%_+.\[\]\-{}!'",~#?&;/=*]*)$/i.test(
      details
    );
  }

  /**
   * Sanitize text
   *  1] removes 3 or more than 3 consecutive new lines
   *  2] trims white spaces
   *
   * @param variable
   *
   * @returns {string}
   */
  static sanitizeText(variable) {
    if (!CommonValidator.validateString(variable)) {
      return false;
    }

    // Return variable.replace(/[\r\n]+/g, '');
    return variable.replace(/\n{3,}/g, '').trim();
  }

  /**
   * Validate if string has stop words.
   *
   * @param {string} string
   *
   * @return {boolean}
   */
  static validateStopWords(string) {
    if (typeof string !== 'string') {
      return false;
    }

    const reg_ex = /\b(?:anal|anus|arse|ballsack|bitch|biatch|blowjob|blow job|bollock|bollok|boner|boob|bugger|bum|butt|buttplug|clitoris|cock|coon|crap|cunt|dick|dildo|dyke|fag|feck|fellate|fellatio|felching|fuck|f u c k|fudgepacker|fudge packer|flange|Goddamn|God damn|homo|jerk|Jew|jizz|Kike|knobend|knob end|labia|muff|nigger|nigga|penis|piss|poop|prick|pube|pussy|scrotum|sex|shit|s hit|sh1t|slut|smegma|spunk|tit|tosser|turd|twat|vagina|wank|whore|porn)\b/i;

    return !reg_ex.test(string);
  }
}

module.exports = CommonValidator;
