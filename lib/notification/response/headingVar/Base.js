const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for heading var base.
 *
 * @class HeadingVarBase
 */
class HeadingVarBase {
  /**
   * Constructor for heading var base.
   *
   * @param {object} params
   * @param {object} params.userNotification
   * @param {object} params.supportingEntities
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userNotification = params.userNotification;
    oThis.supportingEntities = params.supportingEntities;
    oThis.payload = params.payload;
  }

  /**
   * Perform for get template var data.
   *
   * @returns {Promise<*>}
   */
  perform() {
    throw new Error('Sub-class to implement.');
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
      display_text: key
    };

    return responseHelper.successWithData({
      replaceText: key,
      includes: includeData
    });
  }

  /**
   * Entity for template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityType() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Entity id of entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityId() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Attribute of entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityAttribute() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = HeadingVarBase;
