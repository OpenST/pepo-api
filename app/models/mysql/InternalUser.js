const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.bigDbName;

/**
 * Class for user model.
 *
 * @class UserModel
 */
class InternalUserModel extends ModelBase {
  /**
   * Constructor for user model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'internal_users';
  }
}

module.exports = InternalUserModel;
