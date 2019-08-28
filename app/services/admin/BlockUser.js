/**
 * Module to block users
 *
 * @module app/services/admin/BlockUser
 */
const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/ActivityLog'),
  adminActivityLogConst = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class to block users by admin
 *
 * @class
 */
class BlockUser extends ServiceBase {
  /**
   * Constructor to block users by admin
   *
   * @param params
   * @param {Array} params.user_ids: User ids to be blocked by admin.
   * @param {Array} params.current_admin: current admin.
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.userIds = params.user_ids;
    oThis.currentAdminId = params.current_admin.id;

    oThis.userObjects = {};
  }

  /**
   * Main performer
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUsers();

    await oThis._blockUsers();

    await oThis._flushCache();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    const userMultiCache = new UsersCache({ ids: oThis.userIds });
    const cacheRsp = await userMultiCache.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_du_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    for (let userId in cacheRsp.data) {
      let userObj = cacheRsp.data[userId];

      if (userObj.status !== userConstants.activeStatus) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_du_2',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_not_active'],
            debug_options: {}
          })
        );
      }

      oThis.userObjects[userId] = userObj;
    }
  }

  /**
   * Block users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _blockUsers() {
    const oThis = this,
      statusVal = userConstants.invertedStatuses[userConstants.inActiveStatus];

    await new UserModelKlass()
      .update(['status = ?', statusVal])
      .where({ id: oThis.userIds })
      .fire();
  }

  /**
   * Flush all users cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    let promises = [];
    for (let userId in oThis.userObjects) {
      promises.push(UserModelKlass.flushCache(oThis.userObjects[userId]));
    }
    await Promise.all(promises);
  }

  /**
   * Log admin activity
   *
   * @return {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    let activityLogObj = new ActivityLogModel({});

    for (let userId in oThis.userObjects) {
      await activityLogObj.insertAction({
        adminId: oThis.currentAdminId,
        actionOn: userId,
        action: adminActivityLogConst.blockUser
      });
    }
  }
}

module.exports = BlockUser;
