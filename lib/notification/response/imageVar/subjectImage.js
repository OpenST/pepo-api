const rootPrefix = '../../../..',
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  imageVarBase = require(rootPrefix + '/lib/notification/response/imageVar/Base');

/**
 * Class for SubjectImage in notifications.
 *
 * @class SubjectImage
 */
class SubjectImage extends imageVarBase {
  /**
   * Constructor for activity model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;
  }

  /**
   * perform for get image id.
   *
   * @returns {Promise<*>}
   * @private
   */
  async perform() {
    const oThis = this;

    return oThis._getImageId();
  }

  /**
   * entity Id of Entity for get image id.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityId() {
    return oThis.userNotification.subjectUserId;
  }
}

module.exports = SubjectImage;
