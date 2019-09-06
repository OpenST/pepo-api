const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminActivityLogConst = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to block users by admin.
 *
 * @class BlockUser
 */
class BlockUser extends ServiceBase {
  /**
   * Constructor to block users by admin.
   *
   * @param {object} params
   * @param {array} params.user_ids: User ids to be blocked by admin.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userIds = params.user_ids;
    oThis.currentAdminId = params.current_admin.id;

    oThis.userObjects = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUsers();

    await oThis._blockUsers();

    const promisesArray = [];
    promisesArray.push(oThis._flushCache());
    promisesArray.push(oThis._logAdminActivity());
    await Promise.all(promisesArray);

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users.
   *
   * @sets oThis.userObjects
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    const cacheRsp = await UsersCache({ ids: oThis.userIds }).fetch();

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

    for (const userId in cacheRsp.data) {
      const userObj = cacheRsp.data[userId];

      if (userObj.status !== userConstants.activeStatus) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_du_2',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_inactive'],
            debug_options: {}
          })
        );
      }

      oThis.userObjects[userId] = userObj;
    }
  }

  /**
   * Block users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _blockUsers() {
    const oThis = this;

    await new UserModelKlass()
      .update({ status: userConstants.invertedStatuses[userConstants.inActiveStatus] })
      .where({ id: oThis.userIds })
      .fire();
  }

  /**
   * Flush all users cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    const promises = [];

    for (const userId in oThis.userObjects) {
      promises.push(UserModelKlass.flushCache(oThis.userObjects[userId]));
    }

    await Promise.all(promises);
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    const promisesArray = [];

    for (const userId in oThis.userObjects) {
      promisesArray.push(
        new ActivityLogModel().insertAction({
          adminId: oThis.currentAdminId,
          actionOn: userId,
          action: adminActivityLogConst.blockUser
        })
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = BlockUser;
