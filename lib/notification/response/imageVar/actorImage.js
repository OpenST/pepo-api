const rootPrefix = '../../../..',
  imageVarBase = require(rootPrefix + '/lib/notification/response/imageVar/Base');

/**
 * Class for ActorImage in notifications.
 *
 * @class ActorImage
 */
class ActorImage extends imageVarBase {
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
    return oThis.userNotification.actorIds[0].toString();
  }
}

module.exports = ActorImage;
