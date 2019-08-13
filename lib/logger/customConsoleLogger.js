const OSTBase = require('@ostdotcom/base'),
  Logger = OSTBase.Logger,
  getNamespace = require('continuation-local-storage').getNamespace;

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for custom console logger.
 *
 * @class LoggerExtended
 */
class LoggerExtended extends Logger {
  /**
   * Overriding namespace for current repo.
   *
   * @returns {*}
   */
  getRequestNameSpace() {
    return getNamespace('pepoApiNameSpace');
  }
}

// Following is to ensure that INFO logs are printed when debug is off.
let loggerLevel;
if (Number(coreConstants.DEBUG_ENABLED) === 1) {
  loggerLevel = Logger.LOG_LEVELS.DEBUG;
} else {
  loggerLevel = Logger.LOG_LEVELS.INFO;
}

module.exports = new LoggerExtended(coreConstants.APP_NAME, loggerLevel);
