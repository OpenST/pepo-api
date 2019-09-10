const rootPrefix = '../../../..',
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for ThankYouText heading var.
 *
 * @class ThankYouText
 */
class ThankYouText extends HeadingVarBase {
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
    return 'payload';
  }

  /**
   * Entity id of entity for get template var data.
   *
   * @returns {string}
   * @private
   */
  get _entityId() {
    const oThis = this;
    return oThis.userNotification.payload.thankYouText.toString();
  }

  /**
   * Attribute of entity for get template var data.
   *
   * @returns {string}
   * @private
   */
  get _entityAttribute() {
    return 'thankYouText';
  }

  /**
   * Get data for entity.
   *
   * @returns {object}
   */
  getVarData() {
    const oThis = this;

    const key = oThis.supportingEntities.payload.thankYouText;

    const includeData = {
      kind: oThis._entityType,
      id: oThis._entityId,
      display_text: key
    };

    return responseHelper.successWithData({
      [key]: includeData
    });
  }
}

module.exports = ThankYouText;
