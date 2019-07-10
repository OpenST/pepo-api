/**
 * This module helps user to update their profile information
 * @module app/services/user/UpdateProfile.js
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  AddUpdateUserBioKlass = require(rootPrefix + '/lib/user/profile/AddUpdateBio'),
  AddUpdateUserLinkKlass = require(rootPrefix + '/lib/user/profile/AddUpdateLink'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to Update user Profile
 *
 * @class
 */
class UpdateProfile extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.user_id
   * @param {string} params.bio
   * @param {string} params.name
   * @param {string} params.username
   * @param {string} params.link - Social link added by user
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.params = params;
    oThis.userId = params.user_id;
    oThis.bio = params.bio;
    oThis.name = params.name;
    oThis.username = params.username;
    oThis.link = params.link;
    oThis.profileElements = {};
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateUser();

    await oThis._fetchProfileElements();

    let promises = [];
    // Update user bio
    promises.push(
      new AddUpdateUserBioKlass({
        bio: oThis.bio,
        userId: oThis.userId,
        profileElementObj: oThis.profileElements[userProfileElementConst.bioIdKind]
      }).perform()
    );

    // Update user social link
    promises.push(
      new AddUpdateUserLinkKlass({
        url: oThis.link,
        userId: oThis.userId,
        profileElementObj: oThis.profileElements[userProfileElementConst.linkIdKind]
      }).perform()
    );

    // Update user
    promises.push(oThis._updateUser());

    await Promise.all(promises);

    return responseHelper.successWithData({});
  }

  /**
   * Validate if user can update profile
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateUser() {
    const oThis = this;

    if (!oThis.name || !oThis.username) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_up_1',
          api_error_identifier: 'invalid_username',
          debug_options: {}
        })
      );
    }

    let userMultiCache = new UsersCache({ ids: [oThis.userId] });
    let cacheRsp = await userMultiCache.fetch();

    console.log(cacheRsp.data[oThis.userId]);
    if (cacheRsp.isFailure() || Object.keys(cacheRsp.data[oThis.userId]).length <= 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_up_2',
          api_error_identifier: 'user_not_found',
          debug_options: {}
        })
      );
    }

    if (cacheRsp.data[oThis.userId].status != userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_up_3',
          api_error_identifier: 'user_not_active',
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
   * Update user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    const oThis = this;

    await new UserModelKlass()
      .update({
        name: oThis.name,
        user_name: oThis.username
      })
      .where({ id: oThis.userId })
      .fire();
  }
}

module.exports = UpdateProfile;
