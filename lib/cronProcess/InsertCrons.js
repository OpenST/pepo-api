/**
 * Module to insert crons.
 *
 * @module lib/cronProcess/InsertCrons
 */

const rootPrefix = '../..',
  CronProcessModel = require(rootPrefix + '/app/models/mysql/CronProcesses'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProccessValidator = require(rootPrefix + '/lib/cronProcess/Validator'),
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

    oThis.sanitisedApiParams = {};
  }

  async perform() {
    const oThis = this;

    //unique per env support

    await oThis._validateCronProcessParams();

    await oThis._insertIntoCronProcesses();
  }

  async _validateCronProcessParams() {
    const oThis = this;

    let validationRsp = new cronProccessValidator({}).perform();

    oThis.stringifiedCronParams = JSON.stringify(validationRsp.sanitisedApiParams);
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
      kind_name: oThis.cronKind,
      params: oThis.stringifiedCronParams,
      status: new CronProcessModel().invertedStatuses[cronProcessesConstants.stoppedStatus]
    };

    const cronProcessResponse = await new CronProcessModel().insert(cronInsertParams).fire();

    logger.win('Cron process added successfully.');
    logger.log('Cron processId: ', cronProcessResponse.insertId);

    return cronProcessResponse;
  }
}

module.exports = InsertCrons;
