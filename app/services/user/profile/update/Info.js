const rootPrefix = '../../../../..',
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  AddUpdateUserBioKlass = require(rootPrefix + '/lib/user/profile/AddUpdateBio'),
  AddUpdateUserLinkKlass = require(rootPrefix + '/lib/user/profile/AddUpdateLink'),
  TextCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UrlCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to Update user Profile
 *
 * @class
 */
class UpdateProfileInfo extends UpdateProfileBase {
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
    oThis.userUpdateRequired = true;
    oThis.bioUpdateRequired = true;
    oThis.linkUpdateRequired = true;
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
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_up_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_name'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Check whether update is required or not
   *
   * @returns {Promise<void>}
   * @private
   */
  async _isUpdateRequired() {
    const oThis = this;

    // Check whether user update is required or not
    if (oThis.userObj.name.toString() == oThis.name && oThis.userObj.userName.toString() == oThis.username) {
      oThis.userUpdateRequired = false;
    }

    // If bio is present then check whether same bio is added or its updated
    if (oThis.profileElements[userProfileElementConst.bioIdKind]) {
      let textId = oThis.profileElements[userProfileElementConst.bioIdKind].data,
        textResp = await new TextCacheKlass({ ids: [textId] }).fetch(),
        textObj = textResp.data[textId];

      if (textObj.text.toString() == oThis.bio.toString()) {
        oThis.bioUpdateRequired = false;
      }
    }

    // If link is present then check whether same link is added or its updated
    if (oThis.profileElements[userProfileElementConst.linkIdKind]) {
      let linkId = oThis.profileElements[userProfileElementConst.linkIdKind].data,
        urlResp = await new UrlCacheKlass({ ids: [linkId] }).fetch(),
        urlObj = urlResp.data[linkId];

      if (urlObj.url.toString() == oThis.link.toString()) {
        oThis.linkUpdateRequired = false;
      }
    }

    if (!oThis.userUpdateRequired && !oThis.bioUpdateRequired && !oThis.linkUpdateRequired) {
      return responseHelper.successWithData({ noUpdates: true });
    } else {
      return responseHelper.successWithData({ noUpdates: false });
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

    if (oThis.bioUpdateRequired) {
      // Update user bio
      promises.push(
        new AddUpdateUserBioKlass({
          bio: oThis.bio,
          userId: oThis.userId,
          profileElementObj: oThis.profileElements[userProfileElementConst.bioIdKind]
        }).perform()
      );
    }

    if (oThis.linkUpdateRequired) {
      // Update user social link
      promises.push(
        new AddUpdateUserLinkKlass({
          url: oThis.link,
          userId: oThis.userId,
          profileElementObj: oThis.profileElements[userProfileElementConst.linkIdKind]
        }).perform()
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    const oThis = this;

    if (oThis.userUpdateRequired) {
      await new UserModelKlass()
        .update({
          name: oThis.name,
          user_name: oThis.username
        })
        .where({ id: oThis.userId })
        .fire();
    }
  }
}

module.exports = UpdateProfileInfo;
