const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs');

// Declare variables.
const dbName = databaseConstants.adminDbName;

/**
 * Class for admin activity log model.
 *
 * @class AdminActivityLogModel
 */
class AdminActivityLogModel extends ModelBase {
  /**
   * Constructor for admin activity log model.
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
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      adminId: dbRow.admin_id,
      action: adminActivityLogConstants.actions[dbRow.action],
      actionOn: dbRow.action_on,
      extraData: dbRow.extra_data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Insert action.
   *
   * @param {object} params
   * @param {number} params.adminId
   * @param {string} params.action
   * @param {number} params.actionOn
   * @param {string} params.extraData
   *
   * @returns {Promise<any>}
   */
  async insertAction(params) {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    return oThis
      .insert({
        admin_id: params.adminId,
        action: adminActivityLogConstants.invertedActions[params.action],
        action_on: params.actionOn,
        extra_data: params.extraData,
        created_at: currentTime,
        updated_at: currentTime
      })
      .fire();
  }
}

module.exports = AdminActivityLogModel;
