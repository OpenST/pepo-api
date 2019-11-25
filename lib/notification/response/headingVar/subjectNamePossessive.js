const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/**
 * Class for subjectNamePossessive heading var.
 *
 * @class SubjectNamePossessive
 */
class SubjectNamePossessive extends HeadingVarBase {
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
   * Get data for entity.
   *
   * @returns {object}
   */
  getVarData() {
    const oThis = this;

    const key = oThis.supportingEntities[oThis._entityType][oThis._entityId][oThis._entityAttribute] + "'s";

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

    return oThis.userNotification.subjectUserId.toString();
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

module.exports = SubjectNamePossessive;
