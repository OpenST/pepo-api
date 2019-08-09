const rootPrefix = '../../../..',
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Image Vars in notifications.
 *
 * @class ImageVarBase
 */
class ImageVarBase {
  /**
   * Constructor for ImageVar Base.
   *
   * @augments supportingEntities
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userNotification = params.userNotification;
    oThis.supportingEntities = params.supportingEntities;
  }

  /**
   * perform for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  async perform() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * get image id.
   *
   * @returns {Integer}
   *
   * @private
   */
  get _getUserImageId() {
    const oThis = this;

    const user = oThis.supportingEntities[responseEntityKey.users][oThis._entityId];
    return responseHelper.successWithData({ imageId: user.profileImageId });
  }

  /**
   * entity Id of Entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityId() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = ImageVarBase;
