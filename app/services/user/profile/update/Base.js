const rootPrefix = '../../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common');

/**
 * Class to Update user Profile
 *
 * @class
 */
class UpdateProfileBase extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.profile_user_id
   * @param {Object} params.current_user
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.params = params;
    oThis.userId = params.profile_user_id;
    oThis.currentUser = params.current_user;
    oThis.userObj = null;
    oThis.profileElements = {};
    oThis.flushUserCache = true;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validate();

    await oThis._fetchProfileElements();

    let resp = await oThis._isUpdateRequired();
    if (resp.isSuccess() && resp.data.noUpdates) {
      return responseHelper.successWithData({});
    }

    await oThis._updateProfileElements();

    await oThis._updateUser();

    await oThis._flushCaches();

    return responseHelper.successWithData({});
  }

  /**
   * Validate if user can update profile
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validate() {
    const oThis = this;

    if (oThis.currentUser.id != oThis.userId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_b_1',
          api_error_identifier: 'unauthorized_api_request',
          params_error_identifiers: [],
          debug_options: {}
        })
      );
    }

    await oThis._validateParams();

    let userMultiCache = new UsersCache({ ids: [oThis.userId] });
    let cacheRsp = await userMultiCache.fetch();

    if (cacheRsp.isFailure() || !CommonValidators.validateNonEmptyObject(cacheRsp.data[oThis.userId])) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_b_2',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {}
        })
      );
    }

    oThis.userObj = cacheRsp.data[oThis.userId];

    if (oThis.userObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_b_3',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    const userProfileElementsByUserIdCacheObj = new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }),
      cacheRsp = await userProfileElementsByUserIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return;
    }

    let profileElements = cacheRsp.data[oThis.userId];

    for (let kind in profileElements) {
      oThis.profileElements[kind] = profileElements[kind];
    }
  }

  /**
   * Flush all caches
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCaches() {
    const oThis = this;

    // Clear all users cache
    if (oThis.flushUserCache) {
      await UserModelKlass.flushCache({ id: oThis.userId, userName: oThis.username });
    }

    // Clear user profile elements cache
    new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }).clear();
  }

  /**
   * Validate params
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateParams() {
    throw new Error('sub-class to implement');
  }

  /**
   * Check whether update is required or not.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _isUpdateRequired() {
    throw new Error('sub-class to implement');
  }

  /**
   * Method to update profile elements
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    throw new Error('sub-class to implement');
  }

  /**
   * Update user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    throw new Error('sub-class to implement');
  }
}

module.exports = UpdateProfileBase;
