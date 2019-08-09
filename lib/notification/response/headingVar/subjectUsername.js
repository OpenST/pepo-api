const rootPrefix = '../../../..',
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  templateVarBase = require(rootPrefix + '/lib/notification/heading/headingVar/Base');

/**
 * Class for SubjectUsername Template Var.
 *
 * @class SubjectUsername
 */
class SubjectUsername extends templateVarBase {
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
  async perform() {
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
    return responseEntityKey.users;
  }

  /**
   * entity Id of Entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityId() {
    return oThis.userNotification.subjectUserId;
  }

  /**
   * attribute of Entity for get template var data.
   *
   * @returns {Promise<*>}
   * @private
   */
  get _entityAttribute() {
    return 'username';
  }
}

module.exports = SubjectUsername;
