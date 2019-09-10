const rootPrefix = '../../../..',
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Amount heading var.
 *
 * @class Amount
 */
class Amount extends HeadingVarBase {
  /**
   * Perform for get template var data.
   *
   * @returns {Promise<*>}
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
    console.log('oThis.userNotification =======', oThis.userNotification);
    return oThis.userNotification.payload.amount.toString();
  }

  /**
   * Attribute of entity for get template var data.
   *
   * @returns {string}
   * @private
   */
  get _entityAttribute() {
    return 'amount';
  }

  /**
   * Get data for entity.
   *
   * @returns {object}
   */
  getVarData() {
    const oThis = this;

    const key = oThis.supportingEntities.payload.amount;

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

module.exports = Amount;
