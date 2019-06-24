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
  cronSignatureConfig = require(rootPrefix + '/lib/cronProcess/cronSignature'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

// Declare constants.
const has = Object.prototype.hasOwnProperty; // Cache the lookup once, in module scope.

/**
 * Class for cron processes base.
 *
 * @class CronProcessParamValidator
 */
class CronProcessParamValidator {
  /**
   * Constructor for cron processes base.
   *
   * @param {object} params
   * @param {number/string} [params.cronKind]
   * @param {number/string} [params.cronParams]
   * @param {number/string} [params.id]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.cronKind = params.cronKind;
    oThis.cronParams = params.cronParams;
    oThis.sanitisedCronParams = {};

    oThis.cronKindInt = null;
    oThis.paramsConfig = {};
  }

  async perform() {
    const oThis = this;

    await oThis.fetchAndValidateCronKind();

    await oThis._fetchParamsConfig();

    await oThis._validateMandatoryParams();

    await oThis._checkOptionalParams();

    // if sequenceNumber is present, cron is not unique per env
    if (!CommonValidators.isVarNullOrUndefined(oThis.cronParams.sequenceNumber)) {
      await oThis.checkLatestSequenceNumber(oThis.cronParams.sequenceNumber);
    } else {
      // Cron is not unique per env
      await oThis.checkForExistingCronPerSubEnv();
    }

    return responseHelper.successWithData({ sanitisedCronParams: oThis.sanitisedCronParams });
  }

  /**
   * Validate if cron kind is valid or not.
   *
   * @return {Promise<never>}
   * @private
   */
  async fetchAndValidateCronKind() {
    const oThis = this;

    oThis.cronKindInt = cronProcessesConstants.invertedKinds[oThis.cronKind];

    if (!oThis.cronKindInt) {
      logger.error('Invalid cron kind.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_v_1',
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
          internal_error_identifier: 'l_cp_v_2',
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
        Object.prototype.hasOwnProperty.call(oThis.cronParams, whiteListedKeyName) &&
        !CommonValidators.isVarNull(oThis.cronParams[whiteListedKeyName])
      ) {
        // Validate value as per method name passed in config
        let valueToValidate = oThis.cronParams[whiteListedKeyName],
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
          oThis.sanitisedCronParams[whiteListedKeyName] = valueToValidate;
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
      responseHelper.error({
        internal_error_identifier: 'l_cp_v_3',
        api_error_identifier: '',
        debug_options: {}
      });
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
        Object.prototype.hasOwnProperty.call(oThis.cronParams, optionalKeyName) &&
        !CommonValidators.isVarNull(oThis.cronParams[optionalKeyName])
      ) {
        //validate value as per method name passed in config
        let valueToValidate = oThis.cronParams[optionalKeyName],
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
          oThis.sanitisedCronParams[optionalKeyName] = valueToValidate;
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
        responseHelper.error({
          internal_error_identifier: 'l_cp_v_4',
          api_error_identifier: '',
          debug_options: {}
        })
      );
    } else {
      return Promise.resolve(responseHelper.successWithData({}));
    }
  }

  /**
   * Check if sequence number for cron already exists.
   *
   * @param {number} sequenceNumber
   *
   * @return {Promise<never>}
   */
  async checkLatestSequenceNumber(sequenceNumber) {
    const oThis = this;

    const existingCrons = await new CronProcessModel()
        .select('*')
        .where({
          kind: oThis.cronKindInt
        })
        .fire(),
      existingCronsLength = existingCrons.length;

    console.log('existingCronsLength----', existingCronsLength);

    // If entry for cron kind does not exist at all, sequence number should always be one.
    if (existingCronsLength === 0 && sequenceNumber !== 1) {
      logger.error('Sequence number should be 1.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_v_5',
          api_error_identifier: '',
          debug_options: {}
        })
      );
    }

    for (let index = 0; index < existingCronsLength; index += 1) {
      const cronEntity = existingCrons[index],
        cronParams = JSON.parse(cronEntity.params);

      if (cronParams.sequenceNumber == sequenceNumber) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_cp_b_6',
            api_error_identifier: '',
            debug_options: {
              sequenceNumber: cronParams.sequenceNumber
            }
          })
        );
      }
    }
  }

  /**
   * Check if cron kind exists in the same sub-environment again.
   *
   * @return {Promise<never>}
   */
  async checkForExistingCronPerSubEnv() {
    const oThis = this;

    const existingCrons = await new CronProcessModel()
      .select('*')
      .where({
        kind: oThis.cronKindInt
      })
      .fire();

    if (existingCrons.length !== 0) {
      logger.error('Cron already exists for current sub-environment.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_v_7',
          api_error_identifier: '',
          debug_options: {}
        })
      );
    }
  }
}

module.exports = CronProcessParamValidator;
