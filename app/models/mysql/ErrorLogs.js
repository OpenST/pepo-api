const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.infraDbName;

class ErrorLogs extends ModelBase {
  /**
   * Error logs model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'error_logs';
  }
}

module.exports = ErrorLogs;
