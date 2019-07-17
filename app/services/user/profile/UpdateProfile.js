/**
 * This module helps user to update their profile information
 * @module app/services/user/UpdateProfile.js
 */

const rootPrefix = '../../../..',
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  AddUpdateUserBioKlass = require(rootPrefix + '/lib/user/profile/AddUpdateBio'),
  AddUpdateUserLinkKlass = require(rootPrefix + '/lib/user/profile/AddUpdateLink'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to Update user Profile
 *
 * @class
 */
class UpdateProfile extends UpdateProfileBase {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.user_id
   * @param {string} params.bio
   * @param {string} params.name
   * @param {string} params.user_name
   * @param {string} params.link - Social link added by user
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.bio = oThis.params.bio;
    oThis.name = oThis.params.name;
    oThis.username = oThis.params.user_name;
    oThis.link = oThis.params.link;
  }

  /**
   * Validate params
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    if (!oThis.name || !oThis.username) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_p_up_1',
          api_error_identifier: 'invalid_user_name',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Method top update profile elements
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    const oThis = this;

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

    await Promise.all(promises);
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
