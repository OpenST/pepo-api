/**
 * Script to delete expired entries from User Socket Connection Details table.
 *
 * Example: executables/userSocketConnArchival.js --cronProcessId 9
 *
 * @module executables/userSocketConnArchival
 */

const program = require('commander');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/socket/UserSocketConnectionDetails'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socket/socketConnection');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/userSocketConnArchival.js --cronProcessId 9');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

// Declare variables.
const oneDayInSeconds = 24 * 60 * 60,
  limit = 50;

/**
 * Class for cron processes monitor.
 *
 * @class CronProcessesMonitorExecutable
 */
class CronProcessesMonitorExecutable extends CronBase {
  /**
   * Constructor for cron processes monitor.
   *
   * @augments CronBase
   *
   * @constructor
   */
  constructor() {
    const params = { cronProcessId: cronProcessId };

    super(params);

    const oThis = this;

    oThis.canExit = true;
  }

  /**
   * Start the executable.
   *
   * @sets oThis.canExit
   *
   * @returns {Promise<any>}
   * @private
   */
  async _start() {
    const oThis = this;

    oThis.canExit = false;

    await oThis._archiveWebSocketConnDetailsTable();

    oThis.canExit = true;

    return responseHelper.successWithData({});
  }

  /**
   * Archive web socket connection details tabe.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _archiveWebSocketConnDetailsTable() {
    const userIds = [];
    let moreDataPresent = true;

    while (moreDataPresent) {
      const idsToBeDeleted = [],
        selectQueryRsp = await new UserSocketConnectionDetailsModel()
          .select('id, user_id')
          .where(['created_at < ?', basicHelper.getCurrentTimestampInSeconds() - oneDayInSeconds])
          .where([
            '(status = ? AND auth_key_expiry_at < ?) OR (status = ?)',
            socketConnectionConstants.invertedStatuses[socketConnectionConstants.createdStatus],
            basicHelper.getCurrentTimestampInSeconds(),
            socketConnectionConstants.invertedStatuses[socketConnectionConstants.expiredStatus]
          ])
          .limit(limit)
          .fire();

      for (let index = 0; index < selectQueryRsp.length; index++) {
        idsToBeDeleted.push(selectQueryRsp[index].id);
        userIds.push(selectQueryRsp[index].user_id);
      }

      logger.log('idsToBeDeleted: ', idsToBeDeleted);

      if (selectQueryRsp.length === 0) {
        moreDataPresent = false;
      } else {
        await new UserSocketConnectionDetailsModel()
          .delete()
          .where(['id IN (?)', idsToBeDeleted])
          .fire();
      }

      await UserSocketConnectionDetailsModel.flushCache({ userIds: userIds });
    }
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    return oThis.canExit;
  }

  /**
   * Run validations on input parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    // Do nothing.
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.userSocketConnArchival;
  }
}

const cronProcessesMonitor = new CronProcessesMonitorExecutable({ cronProcessId: +cronProcessId });

cronProcessesMonitor
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
