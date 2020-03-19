const program = require('commander');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  UsageData = require(rootPrefix + '/lib/jobs/bg/updateUsageData/UserData'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  GoogleSheet = require(rootPrefix + '/lib/google/Sheet'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/populateUserWeeklyData --cronProcessId 13');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

class PopulateUserWeeklyData extends CronBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.canExit = true;
  }

  /**
   * Validate and sanitize.
   *
   * @private
   */
  _validateAndSanitize() {
    // Do nothing.
  }

  /**
   * Main function.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _start() {
    const oThis = this;

    oThis.canExit = false;

    const dateObj = new Date();
    const startTime = new Date('2019-09-01').getTime() / 1000,
      endDate = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`,
      formattedEndDate = `${dateObj.getDate()}-${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${dateObj.getFullYear()}`,
      endTime = new Date(endDate).getTime() / 1000;

    const sheetName = `User Data Lifetime - till ${formattedEndDate}`,
      sheetGidResp = await new GoogleSheet({}).generateNewTabInSheet(
        coreConstants.PA_GOOGLE_USAGE_REPORT_SPREADSHEET_ID,
        sheetName
      );

    if (sheetGidResp.isSuccess()) {
      await new UsageData({
        queryStartTimeStampInSeconds: startTime,
        queryEndTimeStampInSeconds: endTime,
        sheetName: sheetName,
        sheetGid: sheetGidResp.data.gid
      }).perform();
    }

    oThis.canExit = true;

    return responseHelper.successWithData({});
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    // Once sigint is received we will not process the next batch of rows.
    return oThis.canExit;
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.populateUserWeeklyData;
  }
}

const populateUserDataObj = new PopulateUserWeeklyData({ cronProcessId: +cronProcessId });

populateUserDataObj
  .perform()
  .then(function() {
    logger.step('** Exiting process');
    logger.info('Cron last run at: ', Date.now());
    process.emit('SIGINT');
  })
  .catch(function(err) {
    logger.error('** Exiting process due to Error: ', err);
    process.emit('SIGINT');
  });
