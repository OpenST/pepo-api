const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  adminActivityLogConst = require(rootPrefix + '/lib/globalConstant/adminActivityLogs.js');

// Declare variables.
const dbName = databaseConstants.adminDbName;

/**
 * Class for user profile element model.
 *
 * @class ActivityLogModel
 */
class ActivityLogModel extends ModelBase {
  /**
   * Constructor for user profile element model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'activity_logs';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.action_kind
   * @param {object} dbRow.data
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      action: adminActivityLogConst.actions[dbRow.action],
      data: dbRow.data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Insert activity log
   *
   * @return {Promise<*>}
   */
  async insertAction(params) {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    return oThis
      .insert({
        admin_id: params.adminId,
        action: adminActivityLogConst.invertedActions[params.actionKind],
        data: params.data,
        created_at: currentTime,
        updated_at: currentTime
      })
      .fire();
  }
}

module.exports = ActivityLogModel;
