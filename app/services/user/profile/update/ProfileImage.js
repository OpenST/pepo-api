const rootPrefix = '../../../../..',
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

/**
 * Class to update profile image of user.
 *
 * @class UpdateProfileImage
 */
class UpdateProfileImage extends UpdateProfileBase {
  /**
   * Constructor to update profile image of user.
   *
   * @param {object} params
   * @param {number} params.profile_user_id
   * @param {object} params.current_user
   * @param {string} params.image_url: s3 profile image url
   * @param {string} params.width: width fo the image
   * @param {string} params.height: height fo the image
   * @param {string} params.size: size fo the image
   * @param {boolean} params.isExternalUrl: image source is other than s3 upload
   *
   * @augments UpdateProfileBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.url = oThis.params.image_url;
    oThis.width = oThis.params.width;
    oThis.height = oThis.params.height;
    oThis.size = oThis.params.size;
    oThis.isExternalUrl = oThis.params.isExternalUrl;

    oThis.imageId = null;
    oThis.flushUserCache = true;
    oThis.flushUserProfileElementsCache = false;
  }

  /**
   * Validate params.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    const resp = imageLib.validateImageObj({
      imageUrl: oThis.url,
      size: oThis.size,
      width: oThis.width,
      height: oThis.height,
      kind: imageConstants.profileImageKind,
      isExternalUrl: oThis.isExternalUrl,
      userId: oThis.profileUserId
    });
    if (resp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_pi_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_image_url'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Check whether update is required or not.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _isUpdateRequired() {
    return responseHelper.successWithData({ noUpdates: false });
  }

  /**
   * Update user profile image.
   *
   * @sets oThis.imageId
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    const oThis = this;

    const resp = await imageLib.validateAndSave({
      imageUrl: oThis.url,
      size: oThis.size,
      width: oThis.width,
      height: oThis.height,
      kind: imageConstants.profileImageKind,
      userId: oThis.profileUserId,
      isExternalUrl: oThis.isExternalUrl,
      enqueueResizer: true
    });
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.imageId = resp.data.insertId;
  }

  /**
   * Update user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    const oThis = this;

    await new UserModelKlass()
      .update({
        profile_image_id: oThis.imageId
      })
      .where({ id: oThis.profileUserId })
      .fire();
  }

  /**
   * Extra updates which needs to be done.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _extraUpdates() {
    const oThis = this;
  }

  /**
   * Prepares Response
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({});
  }
}

module.exports = UpdateProfileImage;
