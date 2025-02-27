const rootPrefix = '../../../..',
  imageVarBase = require(rootPrefix + '/lib/notification/response/imageVar/Base');

/**
 * Class for SubjectImage in notifications.
 *
 * @class SubjectImage
 */
class SubjectImage extends imageVarBase {
  /**
   * Constructor for ActorImage in notifications.
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
  perform() {
    const oThis = this;

    return oThis._getUserImageId();
  }

  /**
   * entity Id of Entity for get image id.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityId() {
    const oThis = this;
    return oThis.userNotification.subjectUserId.toString();
  }
}

module.exports = SubjectImage;
