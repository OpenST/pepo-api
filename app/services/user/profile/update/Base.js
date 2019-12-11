const rootPrefix = '../../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Base class to update user profile elements.
 *
 * @class UpdateProfileBase
 */
class UpdateProfileBase extends ServiceBase {
  /**
   * Constructor for base class to update user profile elements.
   *
   * @param {object} params
   * @param {number} params.profile_user_id
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.params = params;
    oThis.profileUserId = params.profile_user_id;
    oThis.currentUserId = params.current_user.id;

    oThis.userObj = null;
    oThis.profileElements = {};
    oThis.flushUserCache = false;
    oThis.flushUserProfileElementsCache = false;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validate();

    await oThis._fetchProfileElements();

    const resp = await oThis._isUpdateRequired();
    if (resp.isSuccess() && resp.data.noUpdates) {
      return responseHelper.successWithData({});
    }

    await oThis._updateProfileElements();

    await oThis._updateUser();

    await oThis._extraUpdates();

    await oThis._flushCaches();

    return oThis._prepareResponse();
  }

  /**
   * Validate if user can update profile.
   *
   * @sets oThis.userObj
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validate() {
    const oThis = this;

    if (+oThis.currentUserId !== +oThis.profileUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_u_b_1',
          api_error_identifier: 'unauthorized_api_request',
          params_error_identifiers: [],
          debug_options: {}
        })
      );
    }

    const userMultiCache = new UsersCache({ ids: [oThis.profileUserId] }),
      cacheRsp = await userMultiCache.fetch();

    if (cacheRsp.isFailure() || !CommonValidators.validateNonEmptyObject(cacheRsp.data[oThis.profileUserId])) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_u_b_2',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {}
        })
      );
    }

    oThis.userObj = cacheRsp.data[oThis.profileUserId];

    if (oThis.userObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_u_b_3',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    await oThis._validateParams();
  }

  /**
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    const userProfileElementsByUserIdCacheObj = new UserProfileElementsByUserIdCache({
        usersIds: [oThis.profileUserId]
      }),
      cacheRsp = await userProfileElementsByUserIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return;
    }

    const profileElements = cacheRsp.data[oThis.profileUserId];

    for (const kind in profileElements) {
      oThis.profileElements[kind] = profileElements[kind];
    }
  }

  /**
   * Flush all caches.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCaches() {
    const oThis = this;

    const promisesArray = [];

    // Clear all users cache.
    if (oThis.flushUserCache) {
      promisesArray.push(UserModelKlass.flushCache({ id: oThis.profileUserId, userName: oThis.username }));
    }

    // Clear user profile elements cache.
    if (oThis.flushUserProfileElementsCache) {
      promisesArray.push(new UserProfileElementsByUserIdCache({ usersIds: [oThis.profileUserId] }).clear());
    }

    await Promise.all(promisesArray);
  }

  /**
   * Validate params.
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
   * Method to update profile elements.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    throw new Error('sub-class to implement');
  }

  /**
   * Update user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    throw new Error('sub-class to implement');
  }

  /**
   * Any other updates which needs to be done.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _extraUpdates() {
    throw new Error('sub-class to implement');
  }

  /**
   * Prepare response
   *
   * @private
   */
  _prepareResponse() {
    throw new Error('sub-class to implement');
  }
}

module.exports = UpdateProfileBase;
