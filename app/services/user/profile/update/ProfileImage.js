const rootPrefix = '../../../../..',
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  imageLib = require(rootPrefix + '/lib/imageLib');

/**
 * Class to update profile image of user
 *
 * @class
 */
class UpdateProfileImage extends UpdateProfileBase {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.user_id - user id
   * @param {string} params.image_url - s3 profile image url
   * @param {string} params.width - width fo the image
   * @param {string} params.height - height fo the image
   * @param {string} params.size - size fo the image
   * @param {boolean} params.isExternalUrl - image source is other than s3 upload
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
  }

  /**
   * Validate Params
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    let resp = imageLib.validateImageObj({
      imageUrl: oThis.url,
      size: oThis.size,
      width: oThis.width,
      height: oThis.height,
      isExternalUrl: oThis.isExternalUrl
    });
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }
  }

  /**
   * Update user profile image
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    const oThis = this;

    let resp = await imageLib.validateAndSave({
      imageUrl: oThis.url,
      size: oThis.size,
      width: oThis.width,
      height: oThis.height,
      kind: imageConstants.profileImageKind,
      userId: oThis.userId,
      isExternalUrl: oThis.isExternalUrl,
      enqueueResizer: true
    });
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.imageId = resp.data.insertId;
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
        profile_image_id: oThis.imageId
      })
      .where({ id: oThis.userId })
      .fire();
  }
}

module.exports = UpdateProfileImage;
