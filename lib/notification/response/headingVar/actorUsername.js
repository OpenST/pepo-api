const rootPrefix = '../../../..',
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  templateVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base');

/**
 * Class for ActorUsername Template Var.
 *
 * @class ActorUsername
 */
class ActorUsername extends templateVarBase {
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
   * perform for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  perform() {
    const oThis = this;

    return oThis._getVarData();
  }

  /**
   * entity for template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityType() {
    const oThis = this;
    return responseEntityKey.users;
  }

  /**
   * entity Id of Entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityId() {
    const oThis = this;
    return oThis.userNotification.actorIds[0];
  }

  /**
   * attribute of Entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityAttribute() {
    const oThis = this;
    return 'username';
  }
}

module.exports = ActorUsername;
