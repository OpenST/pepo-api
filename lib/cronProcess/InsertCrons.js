/**
 * Module to insert crons.
 *
 * @module lib/cronProcess/InsertCrons
 */

const rootPrefix = '../..',
  CronProcessModel = require(rootPrefix + '/app/models/mysql/CronProcesses'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  CronProcessParamValidator = require(rootPrefix + '/lib/cronProcess/CronProcessParamValidator'),
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
   * @param {string} cronKindName
   * @param {object} cronParams
   */
  constructor(params) {
    const oThis = this;

    oThis.cronKindName = params.cronKindName;
    oThis.cronParams = params.cronParams;

    oThis.cronKindInt = null;
    oThis.sanitisedApiParams = {};
  }

  async perform() {
    const oThis = this;

    //unique per env support

    await oThis._validateCronProcessParams();

    return oThis._insertIntoCronProcesses();
  }

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

    logger.win('Cron process added successfully.');
    logger.log('Cron processId: ', cronProcessResponse.insertId);

    return cronProcessResponse;
  }
}

module.exports = InsertCrons;
