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
   * @param {number} dbRow.admin_id
   * @param {string} dbRow.action
   * @param {number} dbRow.action_on
   * @param {object} dbRow.extra_data
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      adminId: dbRow.admin_id,
      action: adminActivityLogConst.actions[dbRow.action],
      actionOn: dbRow.action_on,
      extraData: dbRow.extra_data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Insert action
   *
   * @param params
   * @returns {Promise<any>}
   */
  insertAction(params) {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    return oThis
      .insert({
        admin_id: params.adminId,
        action: adminActivityLogConst.invertedActions[params.action],
        action_on: params.actionOn,
        extra_data: params.extraData,
        created_at: currentTime,
        updated_at: currentTime
      })
      .fire();
  }
}

module.exports = ActivityLogModel;
