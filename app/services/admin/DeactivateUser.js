/**
 * Module to deactivate users
 *
 * @module app/services/admin/DeactivateUser
 */
const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class to deactivate users by admin
 *
 * @class
 */
class DeactivateUser extends ServiceBase {
  /**
   * Constructor to deactivate users by admin
   *
   * @param params
   * @param {Array} params.user_ids: User ids to be deactivated by admin.
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.userIds = params.user_ids;

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

    await oThis._deactivateUsers();

    await oThis._flushCache();

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

      if (UserModelKlass.isUserDeactivatedCreator(userObj)) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_du_3',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_already_deactivated'],
            debug_options: {}
          })
        );
      }

      oThis.userObjects[userId] = userObj;
    }
  }

  /**
   * Deactivate users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deactivateUsers() {
    const oThis = this,
      propertyVal = userConstants.invertedProperties[userConstants.isDeactivatedCreatorProperty];

    await new UserModelKlass()
      .update(['properties = properties | ?', propertyVal])
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
}

module.exports = DeactivateUser;
