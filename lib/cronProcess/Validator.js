/**
 * Module for cron processes base.
 *
 * @module lib/cronProcess/Base
 */

const rootPrefix = '../..',
  CronProcessModel = require(rootPrefix + '/app/models/mysql/CronProcesses'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  cronSignatureConfig = require(rootPrefix + '/lib/cronProcess/cronSignature'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

// Declare constants.
const has = Object.prototype.hasOwnProperty; // Cache the lookup once, in module scope.

/**
 * Class for cron processes base.
 *
 * @class Validator
 */
class Validator {
  /**
   * Constructor for cron processes base.
   *
   * @param {object} params
   * @param {number/string} [params.cron_kind]
   * @param {number/string} [params.cron_params]
   * @param {number/string} [params.id]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.cronKind = params.cron_kind;
    oThis.cronparams = params.cron_params;

    oThis.cronKindInt = null;
    oThis.paramsConfig = {};
  }

  async perform() {
    const oThis = this;

    await oThis.fetchAndValidateCronKind();

    await oThis._fetchParamsConfig();

    await oThis._validateMandatoryParams();

    await oThis._checkOptionalParams();

    return responseHelper.successWithData({ sanitisedApiParams: oThis.sanitisedApiParams });
  }

  /**
   * Validate if cron kind is valid or not.
   *
   * @return {Promise<never>}
   * @private
   */
  async fetchAndValidateCronKind() {
    const oThis = this;

    oThis.cronKindInt = new CronProcessModel().invertedKinds[oThis.cronKind];

    if (!oThis.cronKindInt) {
      logger.error('Invalid cron kind.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_b_1',
          api_error_identifier: '',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch Params Config for cron params
   *
   * @private
   *
   * Sets oThis.paramsConfig
   *
   * @return {Promise<result>}
   */
  async _fetchParamsConfig() {
    const oThis = this;

    oThis.paramsConfig = cronSignatureConfig[oThis.cronKind];

    if (!oThis.paramsConfig) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_v_ap_3',
          api_error_identifier: 'invalid_api_name',
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Config for an API
   *
   * @private
   *
   * @return {result}
   */
  async _validateMandatoryParams() {
    const oThis = this,
      mandatoryKeys = oThis.paramsConfig.mandatory || [],
      paramErrors = [],
      dynamicErrorConfig = {};

    let hasError = false;

    for (let index = 0; index < mandatoryKeys.length; index++) {
      let whiteListedKeyConfig = mandatoryKeys[index],
        whiteListedKeyName = whiteListedKeyConfig.parameter;

      if (
        Object.prototype.hasOwnProperty.call(oThis.apiParams, whiteListedKeyName) &&
        !CommonValidators.isVarNull(oThis.apiParams[whiteListedKeyName])
      ) {
        // Validate value as per method name passed in config
        let valueToValidate = oThis.apiParams[whiteListedKeyName],
          validatorMethodName = whiteListedKeyConfig.validatorMethods,
          validatorMethodInstance = CommonValidators[validatorMethodName],
          isValueValid = null;
        if (!validatorMethodInstance) {
          isValueValid = false;
          logger.error(`${validatorMethodName} does not exist.`);
        } else {
          isValueValid = validatorMethodInstance.apply(CommonValidators, [valueToValidate]);
        }
        if (isValueValid) {
          oThis.sanitisedApiParams[whiteListedKeyName] = valueToValidate;
        } else {
          paramErrors.push(`invalid_${whiteListedKeyName}`);
          dynamicErrorConfig[`invalid_${whiteListedKeyName}`] = {
            parameter: whiteListedKeyName,
            code: 'invalid',
            message:
              'Invalid parameter ' +
              whiteListedKeyName +
              '.  Please ensure the input is well formed or visit https://dev.ost.com/platform/docs/api for details on accepted datatypes for API parameters.'
          };
          hasError = true;
        }
      } else {
        paramErrors.push(`missing_${whiteListedKeyName}`);
        dynamicErrorConfig[`missing_${whiteListedKeyName}`] = {
          parameter: whiteListedKeyName,
          code: 'missing',
          message:
            'Required parameter ' +
            whiteListedKeyName +
            ' is missing. Please inspect for what is being sent, rectify and re-submit.'
        };
        hasError = true;
      }
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'v_ap_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          error_config: basicHelper.fetchErrorConfig(oThis.apiVersion, dynamicErrorConfig),
          debug_options: {}
        })
      );
    } else {
      return Promise.resolve(responseHelper.successWithData({}));
    }
  }

  /**
   * Check optional params
   *
   * @private
   *
   * @return {result}
   */
  async _checkOptionalParams() {
    const oThis = this,
      optionalKeysConfig = oThis.paramsConfig.optional || [],
      paramErrors = [],
      dynamicErrorConfig = {};

    let hasError = false;

    for (let i = 0; i < optionalKeysConfig.length; i++) {
      let optionalKeyConfig = optionalKeysConfig[i],
        optionalKeyName = optionalKeyConfig.parameter;

      if (
        Object.prototype.hasOwnProperty.call(oThis.apiParams, optionalKeyName) &&
        !CommonValidators.isVarNull(oThis.apiParams[optionalKeyName])
      ) {
        //validate value as per method name passed in config
        let valueToValidate = oThis.apiParams[optionalKeyName],
          validatorMethodName = optionalKeyConfig.validatorMethods,
          validatorMethodInstance = CommonValidators[validatorMethodName],
          isValueValid = null;
        if (!validatorMethodInstance) {
          isValueValid = false;
          logger.error(`${validatorMethodName} does not exist.`);
        } else {
          isValueValid = validatorMethodInstance.apply(CommonValidators, [valueToValidate]);
        }
        if (isValueValid) {
          oThis.sanitisedApiParams[optionalKeyName] = valueToValidate;
        } else {
          paramErrors.push(`invalid_${optionalKeyName}`);
          dynamicErrorConfig[`invalid_${optionalKeyName}`] = {
            parameter: optionalKeyName,
            code: 'invalid',
            message:
              'Invalid parameter ' +
              optionalKeyName +
              '.  Please ensure the input is well formed or visit https://dev.ost.com/platform/docs/api for details on accepted datatypes for API parameters.'
          };
          hasError = true;
        }
      }
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'v_ap_4',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          error_config: basicHelper.fetchErrorConfig(oThis.apiVersion, dynamicErrorConfig),
          debug_options: {}
        })
      );
    } else {
      return Promise.resolve(responseHelper.successWithData({}));
    }
  }

  /**
   * Check if sequence number for cron already exists for given chain Id.
   *
   * @param {string} chainIdKey
   * @param {number} chainIdValue
   * @param {number} sequenceNumber
   *
   * @return {Promise<never>}
   */
  async checkLatestSequenceNumber(chainIdKey, chainIdValue, sequenceNumber) {
    const oThis = this;

    const existingCrons = await new CronProcessModel()
        .select('*')
        .where({
          kind: oThis.cronKindInt
        })
        .fire(),
      existingCronsLength = existingCrons.length,
      chainIdToSequenceMapping = {};

    // If entry for cron kind does not exist at all, sequence number should always be one.
    if (existingCronsLength === 0 && sequenceNumber !== 1) {
      logger.error('Sequence number should be 1.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_b_4',
          api_error_identifier: '',
          debug_options: {}
        })
      );
    }

    for (let index = 0; index < existingCronsLength; index += 1) {
      const cronEntity = existingCrons[index],
        cronParams = JSON.parse(cronEntity.params);

      if (has.call(cronParams, chainIdKey)) {
        const chainId = cronParams[chainIdKey];
        chainIdToSequenceMapping[chainId] = chainIdToSequenceMapping[chainId] || [];
        chainIdToSequenceMapping[chainId].push(cronParams.sequenceNumber);
      }
    }

    // If entry for cronKind does not exist for the said chain, the sequence number should always be 1.
    if (!has.call(chainIdToSequenceMapping, chainIdValue) && sequenceNumber !== 1) {
      logger.error('Sequence number should be 1.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_b_5',
          api_error_identifier: '',
          debug_options: {}
        })
      );
    }

    // If entry for chainId exists, perform some validations.
    if (has.call(chainIdToSequenceMapping, chainIdValue)) {
      const maxSequenceNumber = Math.max(...chainIdToSequenceMapping[chainIdValue]);
      // Sequence number should not repeat.
      if (sequenceNumber <= maxSequenceNumber) {
        logger.error('Invalid sequence number. Sequence number already exists.');

        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_cp_b_6',
            api_error_identifier: '',
            debug_options: {}
          })
        );
      }

      // There should only be a difference of 1 between maxSequenceNumber and current sequence number.
      if (sequenceNumber - maxSequenceNumber !== 1) {
        logger.error('Invalid sequence number. Sequence number is not in sequence.');

        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_cp_b_7',
            api_error_identifier: '',
            debug_options: {}
          })
        );
      }
    }
  }

  /**
   * Create entry in cron process table.
   *
   * @param {object} cronParams
   *
   * @return {Promise<any>}
   */
  async insert(cronParams) {
    const oThis = this;

    cronParams = cronParams ? JSON.stringify(cronParams) : null;

    const cronInsertParams = {
      kind: oThis.cronKindInt,
      kind_name: oThis.cronKind,
      params: cronParams,
      status: new CronProcessModel().invertedStatuses[cronProcessesConstants.stoppedStatus]
    };

    const cronProcessResponse = await new CronProcessModel().insert(cronInsertParams).fire();

    logger.win('Cron process added successfully.');
    logger.log('Cron processId: ', cronProcessResponse.insertId);

    return cronProcessResponse;
  }

  /**
   * Get cron kind.
   */
  get getCronKind() {
    throw new Error('sub-class to implement.');
  }
}

module.exports = Validator;
