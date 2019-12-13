const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class to fire pixel.
 *
 * @class FirePixel
 */
class FirePixel {
  /**
   * Constructor to fire pixel.
   *
   * @param {object} params
   * @param {object} params.pixelVars
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.pixelVars = params.pixelVars;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const header = { 'User-Agent': pixelConstants.pixelUserAgent };

    const httpLibObj = new HttpLibrary({
      resource: coreConstants.PA_TRACKER_ENDPOINT,
      header: header
    });

    await httpLibObj.get(oThis.pixelVars).catch(function(err) {
      logger.error(err);

      return createErrorLogsEntry.perform(err, errorLogsConstants.lowSeverity);
    });
  }
}

module.exports = FirePixel;
