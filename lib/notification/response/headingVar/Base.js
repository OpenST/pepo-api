const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Heading Var Base.
 *
 * @class HeadingVarBase
 */
class HeadingVarBase {
  /**
   * Constructor for TemplateVar Base.
   *
   * @augments supportingEntities
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userNotification = params.userNotification;
    oThis.supportingEntities = params.supportingEntities;
  }

  /**
   * perform for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  perform() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * get data for entity.
   *
   * @returns {Object}
   *
   * @private
   */
  _getVarData() {
    const oThis = this;
    const includeData = {};

    includeData['kind'] = oThis._entityType;
    includeData['id'] = oThis._entityId;
    includeData['attribute'] = oThis._entityAttribute;

    const key = oThis.supportingEntities[includeData['kind']][includeData['id']][includeData['attribute']];

    return responseHelper.successWithData({
      [key]: includeData
    });
  }

  /**
   * entity for template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityType() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * entity Id of Entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityId() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * attribute of Entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityAttribute() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = HeadingVarBase;
