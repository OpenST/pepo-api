/**
 * Module to insert crons.
 *
 * @module lib/cronProcess/InsertCrons
 */

const rootPrefix = '../..',
  CronProcessModel = require(rootPrefix + '/app/models/mysql/CronProcesses'),
  CronProcessParamValidator = require(rootPrefix + '/lib/cronProcess/CronProcessParamValidator'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

/**
 * Class to insert crons.
 *
 * @class InsertCrons
 */
class InsertCrons {
  /**
   * Constructor
   *
   * @param params
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.cronKindName = params.cronKindName;
    oThis.cronParams = params.cronParams;

    oThis.cronKindInt = null;
    oThis.stringifiedCronParams = {};
  }

  /**
   * Perform.
   *
   * @returns {Promise<any>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateCronProcessParams();

    return oThis._insertIntoCronProcesses();
  }

  /**
   * Validate cron process params.
   *
   * @sets oThis.cronKindInt, oThis.stringifiedCronParams
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateCronProcessParams() {
    const oThis = this;

    let validationRsp = await new CronProcessParamValidator({
      cronKind: oThis.cronKindName,
      cronParams: oThis.cronParams
    }).perform();

    if (!validationRsp || validationRsp.isFailure()) {
      return Promise.reject(validationRsp);
    }

    oThis.cronKindInt = cronProcessesConstants.invertedKinds[oThis.cronKindName];
    oThis.stringifiedCronParams = JSON.stringify(validationRsp.data.sanitisedCronParams);
  }

  /**
   * Create entry in cron process table.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _insertIntoCronProcesses() {
    const oThis = this;

    const cronInsertParams = {
      kind: oThis.cronKindInt,
      kind_name: oThis.cronKindName,
      params: oThis.stringifiedCronParams,
      status: cronProcessesConstants.invertedStatuses[cronProcessesConstants.stoppedStatus]
    };

    const cronProcessResponse = await new CronProcessModel().insert(cronInsertParams).fire();

    logger.win('** Cron process added successfully.');
    logger.info('*** Cron processId: ', cronProcessResponse.insertId);

    return cronProcessResponse;
  }
}

module.exports = InsertCrons;
