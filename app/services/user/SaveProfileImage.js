const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CreateImageLib = require(rootPrefix + '/lib/user/image/Create'),
  UpdateImageLib = require(rootPrefix + '/lib/user/image/Update'),
  DeleteImageLib = require(rootPrefix + '/lib/user/image/Delete'),
  ImageConstants = require(rootPrefix + 'lib/globalConstant/image'),
  GetResolutionLib = require(rootPrefix + '/lib/user/image/GetResolution');

/**
 * Class for user profile get
 *
 * @class
 */
class SaveProfileImage extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.user_id - user id
   * @param {string} params.s3_profile_image_url - s3 profile image url
   * @param {string} params.width - width fo the image
   * @param {string} params.height - height fo the image
   * @param {string} params.size - size fo the image
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.params = params;
    oThis.userId = params.user_id;
    oThis.url = params.s3_profile_image_url;
    oThis.width = params.width;
    oThis.height = params.height;
    oThis.size = params.size;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    return oThis._saveImageDetails();
  }

  /**
   * Save image details
   *
   * @return {Promise<void>}
   * @private
   */
  async _saveImageDetails() {
    const oThis = this;

    let UserRsp = new UserModel().fetchById(oThis.userId);

    let getResolution = new GetResolutionLib(oThis.params);

    if (UserRsp[oThis.userId] && oThis.url !== '') {
      let updateProfileImageParams = {
        userId: oThis.userId,
        resolutions: getResolution,
        entityKind: null,
        status: new ImageConstants().notResized,
        isProfileElement: true,
        imageId: UserRsp[oThis.userId].profileImageId
      };

      await new UpdateImageLib(updateProfileImageParams).perform();
    } else if (UserRsp[oThis.userId] && oThis.url === '') {
      let deleteProfileImageParams = {
        userId: oThis.userId,
        isProfileElement: true,
        imageId: UserRsp[oThis.userId].profileImageId
      };

      await new DeleteImageLib(deleteProfileImageParams).perform();

      await new UserModel()
        .update({ profile_image_id: null })
        .where(['id = ?', oThis.userId])
        .fire();
    } else {
      let createProfileImageParams = {
        userId: oThis.userId,
        resolutions: getResolution,
        entityKind: null,
        status: new ImageConstants().notResized,
        isProfileElement: true
      };

      let insertRsp = await new CreateImageLib(createProfileImageParams).perform();

      let profileImageId = insertRsp.insertId;

      await new UserModel()
        .update({ profile_image_id: profileImageId })
        .where(['id = ?', oThis.userId])
        .fire();
    }
  }
}

module.exports = SaveProfileImage;
