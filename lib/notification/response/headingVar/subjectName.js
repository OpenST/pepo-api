const rootPrefix = '../../../..',
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/**
 * Class for subjectName heading var.
 *
 * @class SubjectName
 */
class SubjectName extends HeadingVarBase {
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

module.exports = SubjectName;
