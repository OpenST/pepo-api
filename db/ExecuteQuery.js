const mysql = require('mysql');

const rootPrefix = '..',
  mysqlConfig = require(rootPrefix + '/config/mysql');

class ExecuteQuery {
  /**
   * Constructor
   *
   * @param dbName
   * @param sql
   */
  constructor(dbName, sql) {
    const oThis = this;

    oThis.dbName = dbName;
    oThis.sql = sql;
  }

  /**
   * Get connection params
   *
   * @return {String}
   */
  get connectionParams() {
    const oThis = this;

    let clusters = mysqlConfig['databases'][oThis.dbName];

    return mysqlConfig['clusters'][clusters[0]]['master'];
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const connection = mysql.createConnection(oThis.connectionParams);

    // Create DB if not present
    await new Promise(function(onResolve, onReject) {
      let dbCreationSql =
        'CREATE DATABASE IF NOT EXISTS ' + oThis.dbName + ' DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;';

      connection.query(dbCreationSql, function(err) {
        if (err) {
          onReject(err);
        }

        onResolve();
      });
    });

    // Execute the sql
    await new Promise(function(onResolve, onReject) {
      let useDbQuery = 'USE ' + oThis.dbName;

      connection.query(useDbQuery, function(err) {
        if (err) {
          onReject(err);
        }
        onResolve();
      });
    });

    // Execute the sql
    await new Promise(function(onResolve, onReject) {
      connection.query(oThis.sql, function(err) {
        if (err) {
          onReject(err);
        }

        console.log('Executed:', oThis.sql);

        onResolve();
      });
    });

    // End the connection
    await new Promise(function(onResolve, onReject) {
      connection.end(function(err) {
        if (err) {
          throw err;
        }

        onResolve();
      });
    });
  }
}

module.exports = ExecuteQuery;
