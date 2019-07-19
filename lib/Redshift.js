/**
 * Wrapper for executing redshift query.
 *
 * @module lib/Redshift
 */

const rootPrefix = '..',
  redshiftProvider = require(rootPrefix + '/lib/providers/redshift'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for executing the redshift query.
 *
 * @class
 */
class Redshift {
  /**
   *
   * @constructor
   */
  constructor() {}

  /**
   * Initialize redshift Obj.
   *
   * @sets oThis.redshiftClient
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initializeRedshiftObj() {
    const oThis = this;
    oThis.redshiftClient = await redshiftProvider.getInstance();
  }

  /**
   * Perform the redshift query
   *
   */
  async query(commandString) {
    const oThis = this;

    if (!oThis.redshiftClient) {
      await oThis._initializeRedshiftObj();
    }

    logger.info('Redshift query String', commandString);
    return new Promise(function(resolve, reject) {
      try {
        oThis.redshiftClient.query(commandString, function(err, result) {
          if (err) {
            reject('Error in query ' + err);
          } else {
            resolve(result);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Perform the redshift parameterizedQuery
   *
   */
  async parameterizedQuery(commandString, parameterizedArray) {
    const oThis = this;

    if (!oThis.redshiftClient) {
      await oThis._initializeRedshiftObj();
    }

    logger.info('Redshift parameterizedQuery String', commandString);
    return new Promise(function(resolve, reject) {
      try {
        oThis.redshiftClient.parameterizedQuery(commandString, parameterizedArray, function(err, result) {
          if (err) {
            reject('Error in parameterizedQuery ' + err);
          } else {
            resolve(result);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Redshift;
