const rootPrefix = '../../../..',
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  headingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base');

/**
 * Class for ActorUsername Heading Var.
 *
 * @class ActorUsername
 */
class ActorUsername extends headingVarBase {
  /**
   * Constructor for Actor User Name.
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
    return oThis.userNotification.actorIds[0].toString();
  }

  /**
   * attribute of Entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityAttribute() {
    const oThis = this;
    return 'userName';
  }
}

module.exports = ActorUsername;
