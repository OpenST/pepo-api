const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  MysqlQueryBuilders = require(rootPrefix + '/lib/queryBuilders/Mysql'),
  util = require(rootPrefix + '/lib/util'),
  mysqlWrapper = require(rootPrefix + '/lib/mysqlWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  mysqlErrorConstants = require(rootPrefix + '/lib/globalConstant/mysqlErrorConstants');

/**
 * Class for models base.
 *
 * @class ModelBase
 */
class ModelBase extends MysqlQueryBuilders {
  /**
   * Constructor for models base.
   *
   * @param {object} params
   * @param {string} params.dbName
   *
   * @augments MysqlQueryBuilders
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.dbName = params.dbName;
  }

  /**
   * Connection pool to use for read query.
   *
   * @return {*}
   */
  onReadConnection() {
    /*
    At present, following is not being used. But when we implement replication,
    following connection pool will be used for slave connections.
     */
    return mysqlWrapper.getPoolFor(this.dbName, 'master');
  }

  /**
   * Connection pool to use for write query.
   *
   * @return {*}
   */
  onWriteConnection() {
    return mysqlWrapper.getPoolFor(this.dbName, 'master');
  }

  /**
   * Fire the query.
   *
   * @return {Promise<any>}
   */
  fire() {
    const oThis = this;

    return new Promise(function(onResolve, onReject) {
      const queryGenerator = oThis.generate();

      const preQuery = Date.now();
      const qry = oThis
        .onWriteConnection()
        .query(queryGenerator.data.query, queryGenerator.data.queryData, function(err, result, fields) {
          logger.info('(' + (Date.now() - preQuery) + ' ms)', qry.sql);
          if (err) {
            onReject(err);
          } else {
            result.defaultUpdatedAttributes = queryGenerator.data.defaultUpdatedAttributes;
            onResolve(result);
          }
        });
    });
  }

  /**
   * Convert Bitwise to enum values.
   *
   * @param {string} bitwiseColumnName
   * @param {number} bitwiseColumnValue
   *
   * @return {array}
   */
  getBitwiseArray(bitwiseColumnName, bitwiseColumnValue) {
    const oThis = this;
    if (!oThis.bitwiseConfig) {
      throw new Error('Bitwise Config not defined');
    }
    const modelInstance = new oThis.constructor();

    const config = oThis.bitwiseConfig[bitwiseColumnName],
      arr = [];

    if (!config) {
      throw new Error(`Bitwise Config for ${bitwiseColumnValue} not defined`);
    }

    Object.keys(config).forEach((key) => {
      const value = config[key];
      if ((bitwiseColumnValue & key) == key) {
        arr.push(value);
      }
    });

    return arr;
  }

  /**
   * Convert enum to Bitwise values.
   *
   * @param {string} bitwiseColumnName
   * @param {number} bitwiseColumnExistingValue
   * @param {number} bitEnumToSet
   *
   * @return {number}
   */
  setBitwise(bitwiseColumnName, bitwiseColumnExistingValue, bitEnumToSet) {
    const oThis = this;

    if (!oThis.bitwiseConfig) {
      throw new Error('Bitwise Config not defined.');
    }

    const config = oThis.bitwiseConfig[bitwiseColumnName],
      invertedConfig = util.invert(config),
      bitEnumIntegerValue = invertedConfig[bitEnumToSet];

    if (!bitEnumIntegerValue) {
      throw new Error('Invalid enum passed.');
    }

    return bitwiseColumnExistingValue | bitEnumIntegerValue;
  }

  /**
   * Unset enum to Bitwise values.
   *
   * @param {string} bitwiseColumnName
   * @param {number} bitwiseColumnExistingValue
   * @param {number} bitEnumToUnSet
   *
   * @return {number}
   */
  unSetBitwise(bitwiseColumnName, bitwiseColumnExistingValue, bitEnumToUnSet) {
    const oThis = this;

    if (!oThis.bitwiseConfig) {
      throw new Error('Bitwise Config not defined');
    }

    const config = oThis.bitwiseConfig[bitwiseColumnName],
      invertedConfig = util.invert(config),
      bitEnumIntegerValue = invertedConfig[bitEnumToUnSet];

    if (!bitEnumIntegerValue) {
      throw new Error('Invalid enum passed');
    }

    return bitwiseColumnExistingValue & ~bitEnumIntegerValue;
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'createdAt', 'updatedAt'];
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedData(formattedRow) {
    const oThis = this;

    const safeData = {},
      safeFormattedColumnNamesArr = oThis.safeFormattedColumnNames();

    for (let index = 0; index < safeFormattedColumnNamesArr.length; index++) {
      const colName = safeFormattedColumnNamesArr[index];
      safeData[colName] = formattedRow[colName];
    }

    return safeData;
  }

  /**
   * Format final DB data.
   *
   * @param {object} formattedData
   *
   * @returns {object}
   */
  sanitizeFormattedData(formattedData) {
    const finalResponse = {};

    for (const key in formattedData) {
      if (!CommonValidators.isVarUndefined(formattedData[key])) {
        finalResponse[key] = formattedData[key];
      }
    }

    return finalResponse;
  }

  /**
   * Check for duplicate index violation.
   *
   * @param {string} indexName
   * @param {object} mysqlErrorObject
   *
   * @returns {boolean}
   */
  static isDuplicateIndexViolation(indexName, mysqlErrorObject) {
    return (
      mysqlErrorObject.code === mysqlErrorConstants.duplicateError && mysqlErrorObject.sqlMessage.includes(indexName)
    );
  }
}

module.exports = ModelBase;
