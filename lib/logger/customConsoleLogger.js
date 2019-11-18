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
let envVal = coreConstants.DEFAULT_LOG_LEVEL;
let strEnvVal = String(envVal).toUpperCase();

if (Logger.LOG_LEVELS.hasOwnProperty(strEnvVal)) {
  loggerLevel = Logger.LOG_LEVELS[strEnvVal];
} else {
  loggerLevel = Logger.LOG_LEVELS.INFO;
}

module.exports = new LoggerExtended(coreConstants.APP_NAME, loggerLevel);
