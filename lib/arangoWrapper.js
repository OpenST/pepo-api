const rootPrefix = '..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  arangoProvider = require(rootPrefix + '/lib/providers/arango'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for arango-driver wrapper.
 *
 * @class ArangoSdkWrapper
 */
class ArangoSdkWrapper {
  /**
   * Initialize arango object.
   *
   * @sets oThis.client
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initializeArangoObj() {
    const oThis = this;

    oThis.client = await arangoProvider.getInstance();
  }

  /**
   * Method to run a single arango query.
   *
   * @param {string} query
   * @param {object} params
   * @param {object} [options]
   *
   * @returns {Promise<*>}
   */
  async query(query, bindVars, options = {}) {
    const oThis = this;

    if (!oThis.client) {
      await oThis._initializeArangoObj();
    }

    const preQuery = Date.now();

    return new Promise(function(resolve, reject) {
      oThis.client
        .query({
          query: query,
          bindVars: bindVars
        })
        .then((response) => {
          logger.info('(' + (Date.now() - preQuery) + ' ms)', query, bindVars);
          return resolve(response);
        })
        .catch((err) => {
          logger.debug(
            `Error in execute arango query CODE: ${err.code}, statusCode: ${err.statusCode}, \n stack: ${err.stack}`
          );
          logger.error(query, bindVars);
          reject(err);
        });
    });
  }
}

module.exports = new ArangoSdkWrapper();
