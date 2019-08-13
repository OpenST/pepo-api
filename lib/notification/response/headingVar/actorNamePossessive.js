const rootPrefix = '../../../..',
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/**
 * Class for ActorNamePossessive heading var.
 *
 * @class ActorNamePossessive
 */
class ActorNamePossessive extends HeadingVarBase {
  /**
   * Perform for get template var data.
   *
   * @returns {object}
   */
  perform() {
    const oThis = this;

    return oThis.getVarData();
  }

  /**
   * Get data for entity.
   *
   * @returns {object}
   */
  getVarData() {
    const oThis = this;

    const key = oThis.supportingEntities[oThis._entityType][oThis._entityId][oThis._entityAttribute];

    const includeData = {
      kind: oThis._entityType,
      id: oThis._entityId,
      display_text: key + "'s"
    };

    return responseHelper.successWithData({
      [key]: includeData
    });
  }

  /**
   * Entity for template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityType() {
    return responseEntityKey.users;
  }

  /**
   * Entity id of entity for get template var data.
   *
   * @returns {string}
   * @private
   */
  get _entityId() {
    const oThis = this;

    return oThis.userNotification.actorIds[0].toString();
  }

  /**
   * Attribute of entity for get template var data.
   *
   * @returns {string}
   * @private
   */
  get _entityAttribute() {
    return 'name';
  }
}

module.exports = ActorNamePossessive;
