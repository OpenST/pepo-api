/**
 * Module for cron process param validator.
 *
 * @module lib/cronProcess/CronProcessParamValidator
 */

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  CronProcessModel = require(rootPrefix + '/app/models/mysql/CronProcesses'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cronSignatureConfig = require(rootPrefix + '/lib/cronProcess/cronSignature'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

/**
 * Class for cron processes param validator.
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
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.cronKind = params.cronKind;
    oThis.cronParams = params.cronParams;
    oThis.sanitisedCronParams = {};

    oThis.cronKindInt = null;
    oThis.cronParamsConfig = {};
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchAndValidateCronKind();

    await oThis._fetchParamsConfig();

    await oThis._validateMandatoryParams();

    await oThis._validateOptionalParams();

    // If sequenceNumber is present, validate sequenceNumber.
    if (!CommonValidators.isVarNullOrUndefined(oThis.cronParams.sequenceNumber)) {
      await oThis._checkLatestSequenceNumber(oThis.cronParams.sequenceNumber);
    } else {
      // Cron is unique per env.
      await oThis._checkForExistingCronPerSubEnv();
    }

    return responseHelper.successWithData({ sanitisedCronParams: oThis.sanitisedCronParams });
  }

  /**
   * Validate if cron kind is valid or not.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateCronKind() {
    const oThis = this;

    oThis.cronKindInt = cronProcessesConstants.invertedKinds[oThis.cronKind];

    if (!oThis.cronKindInt) {
      logger.error('Invalid cron kind.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_cppv_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch params config for cron params.
   *
   * @sets oThis.cronParamsConfig
   *
   * @returns {*}
   * @private
   */
  async _fetchParamsConfig() {
    const oThis = this;

    oThis.cronParamsConfig = cronSignatureConfig[oThis.cronKind];

    if (!oThis.cronParamsConfig) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_cppv_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate mandatory cron params.
   *
   * @sets oThis.sanitisedCronParams
   *
   * @returns {result}
   * @private
   */
  async _validateMandatoryParams() {
    const oThis = this,
      mandatoryKeys = oThis.cronParamsConfig.mandatory || [],
      paramErrors = [];

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
          hasError = true;
        }
      } else {
        paramErrors.push(`missing_${whiteListedKeyName}`);
        hasError = true;
      }
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_cppv_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            paramErrors: paramErrors
          }
        })
      );
    } else {
      return responseHelper.successWithData({});
    }
  }

  /**
   * Validate optional params.
   *
   * @sets oThis.sanitisedCronParams
   *
   * @returns {result}
   * @private
   */
  async _validateOptionalParams() {
    const oThis = this,
      optionalKeysConfig = oThis.cronParamsConfig.optional || [],
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
        // Validate value as per method name passed in config.
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
          hasError = true;
        }
      }
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_cppv_4',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            paramErrors: paramErrors
          }
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
   * @returns {Promise<never>}
   * @private
   */
  async _checkLatestSequenceNumber(sequenceNumber) {
    const oThis = this;

    const existingCrons = await new CronProcessModel()
        .select('*')
        .where({
          kind: oThis.cronKindInt
        })
        .fire(),
      existingCronsLength = existingCrons.length;

    // If entry for cron kind does not exist at all, sequence number should always be one.
    if (existingCronsLength === 0 && sequenceNumber !== 1) {
      logger.error('Sequence number should be 1.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cp_cppv_5',
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
            internal_error_identifier: 'l_cp_cppv_6',
            api_error_identifier: 'something_went_wrong',
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
   * @private
   */
  async _checkForExistingCronPerSubEnv() {
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
          internal_error_identifier: 'l_cp_cppv_7',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }
  }
}

module.exports = CronProcessParamValidator;
