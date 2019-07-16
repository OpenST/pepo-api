/**
 * This module helps user to update their profile information
 * @module app/services/user/UpdateProfile.js
 */

const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
   * @param {number} params.user_id
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.params = params;
    oThis.userId = params.user_id;
    oThis.profileElements = {};
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

    await oThis._updateProfileElements();

    await oThis._updateUser();

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

    await oThis._validateParams();

    let userMultiCache = new UsersCache({ ids: [oThis.userId] });
    let cacheRsp = await userMultiCache.fetch();

    if (cacheRsp.isFailure() || Object.keys(cacheRsp.data[oThis.userId]).length <= 0) {
      // return Promise.reject(
      //   responseHelper.error({
      //     internal_error_identifier: 'a_s_u_p_b_1',
      //     api_error_identifier: 'user_not_found',
      //     debug_options: {}
      //   })
      // );
    }

    if (cacheRsp.data[oThis.userId].status != userConstants.activeStatus) {
      // return Promise.reject(
      //   responseHelper.error({
      //     internal_error_identifier: 'a_s_u_p_b_2',
      //     api_error_identifier: 'user_not_active',
      //     debug_options: {}
      //   })
      // );
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
   * Validate params
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateParams() {
    throw 'sub-class to implement';
  }

  /**
   * Method to update profile elements
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    throw 'Sub-class to implement';
  }

  /**
   * Update user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    throw 'sub-class to implement';
  }
}

module.exports = UpdateProfileBase;
