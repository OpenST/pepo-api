const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = coreConstants.INFRA_MYSQL_DB;

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
