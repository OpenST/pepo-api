const rootPrefix = '../../../..',
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/**
 * Class for ChannelName heading var.
 *
 * @class ChannelName
 */
class ChannelName extends HeadingVarBase {
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
   * Entity for template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityType() {
    return responseEntityKey.channels;
  }

  /**
   * Entity id of entity for get template var data.
   *
   * @returns {string}
   * @private
   */
  get _entityId() {
    const oThis = this;
    return oThis.userNotification.payload.channelId;
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

module.exports = ChannelName;
