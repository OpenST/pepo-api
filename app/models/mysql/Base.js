const rootPrefix = '../../..',
  MysqlQueryBuilders = require(rootPrefix + '/lib/queryBuilders/mysql'),
  mysqlWrapper = require(rootPrefix + '/lib/mysqlWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  util = require(rootPrefix + '/lib/util'),
  bitHelper = require(rootPrefix + '/helpers/bit');

class ModelBase extends MysqlQueryBuilders {
  /**
   * Base Model Constructor
   *
   * @constructor
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.dbName = params.dbName;
  }

  /**
   * Connection pool to use for read query
   *
   * @return {*}
   */
  onReadConnection() {
    // At present, following is not being used. But when we implement replication,
    // following connection pool will be used for slave connections.
    return mysqlWrapper.getPoolFor(this.dbName, 'master');
  }

  /**
   * Connection pool to use for write query
   *
   * @return {*}
   */
  onWriteConnection() {
    return mysqlWrapper.getPoolFor(this.dbName, 'master');
  }

  /**
   * Fire the query
   *
   * @return {Promise<any>}
   */
  fire() {
    const oThis = this;

    return new Promise(function(onResolve, onReject) {
      const queryGenerator = oThis.generate();

      let preQuery = Date.now();
      let qry = oThis
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
   * Convert Bitwise to enum values
   *
   * @return {Array}
   */
  getBitwiseArray(bitwiseColumnName, bitwiseColumnValue) {
    const oThis = this;
    if (!oThis.bitwiseConfig) {
      throw new Error('Bitwise Config not defined');
    }
    let modelInstance = new oThis.constructor();

    let config = oThis.bitwiseConfig[bitwiseColumnName],
      arr = [];

    if (!config) {
      throw new Error(`Bitwise Config for ${bitwiseCloumnName} not defined`);
    }

    Object.keys(config).forEach((key) => {
      let value = config[key];
      if ((bitwiseColumnValue & key) == key) {
        arr.push(value);
      }
    });

    return arr;
  }

  /**
   * Convert enum to Bitwise values
   *
   * @return {number}
   */
  setBitwise(bitwiseColumnName, bitwiseColumnExistingValue, bitEnumToSet) {
    const oThis = this;
    if (!oThis.bitwiseConfig) {
      throw new Error('Bitwise Config not defined');
    }

    let config = oThis.bitwiseConfig[bitwiseColumnName],
      invertedConfig = util.invert(config),
      bitEnumIntegerValue = invertedConfig[bitEnumToSet];

    if (!bitEnumIntegerValue) {
      throw new Error('Invalid enum passed');
    }

    return bitwiseColumnExistingValue | bitEnumIntegerValue;
  }

  /**
   * unset enum to Bitwise values
   *
   * @return {number}
   */
  unSetBitwise(bitwiseColumnName, bitwiseColumnExistingValue, bitEnumToUnSet) {
    const oThis = this;
    if (!oThis.bitwiseConfig) {
      throw new Error('Bitwise Config not defined');
    }

    let config = oThis.bitwiseConfig[bitwiseColumnName],
      invertedConfig = util.invert(config),
      bitEnumIntegerValue = invertedConfig[bitEnumToUnSet];

    if (!bitEnumIntegerValue) {
      throw new Error('Invalid enum passed');
    }

    return bitwiseColumnExistingValue & ~bitEnumIntegerValue;
  }

  /**
   * List Of Formatted Column names that can be exposed by service
   *
   *
   * @returns {Array}
   */
  safeFormattedColumnNames() {
    return ['id', 'createdAt', 'updatedAt'];
  }

  /**
   * List Of Formatted Column names that can be exposed by service
   *
   *
   * @returns {Array}
   */
  safeFormattedData(formattedRow) {
    const oThis = this,
      safeData = {},
      safeFormattedColumnNamesArr = oThis.safeFormattedColumnNames();

    for (let i = 0; i < safeFormattedColumnNamesArr.length; i++) {
      const colName = safeFormattedColumnNamesArr[i];
      safeData[colName] = formattedRow[colName];
    }

    return safeData;
  }
}

module.exports = ModelBase;
