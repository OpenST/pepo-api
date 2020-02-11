const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for current user channel relation formatter.
 *
 * @class CurrentUserChannelRelationSingleFormatter
 */
class CurrentUserChannelRelationSingleFormatter extends BaseFormatter {
  /**
   * Constructor for current user channel relation formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserChannelRelation
   * @param {number} params.currentUserChannelRelation.id
   * @param {number} params.currentUserChannelRelation.isAdmin
   * @param {number} params.currentUserChannelRelation.isMember
   * @param {number} params.currentUserChannelRelation.notificationStatus
   * @param {number} params.currentUserChannelRelation.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserChannelRelation = params.currentUserChannelRelation;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const entityConfig = {
      id: { isNullAllowed: false },
      isAdmin: { isNullAllowed: false },
      isMember: { isNullAllowed: false },
      notificationStatus: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.currentUserChannelRelation, entityConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.currentUserChannelRelation.id,
      is_admin: Number(oThis.currentUserChannelRelation.isAdmin),
      is_member: Number(oThis.currentUserChannelRelation.isMember),
      notification_status: Number(oThis.currentUserChannelRelation.notificationStatus),
      uts: oThis.currentUserChannelRelation.updatedAt
    });
  }
}

module.exports = CurrentUserChannelRelationSingleFormatter;
