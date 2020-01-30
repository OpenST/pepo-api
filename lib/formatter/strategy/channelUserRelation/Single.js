const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel user relation formatter.
 *
 * @class ChannelUserRelationSingleFormatter
 */
class ChannelUserRelationSingleFormatter extends BaseFormatter {
  /**
   * Constructor for current user channel relation formatter.
   *
   * @param {object} params
   * @param {object} params.channelUserRelation
   * @param {number} params.channelUserRelation.id
   * @param {number} params.channelUserRelation.isAdmin
   * @param {number} params.channelUserRelation.isMember
   * @param {number} params.channelUserRelation.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelUserRelation = params.channelUserRelation;
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
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.channelUserRelation, entityConfig);
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
      id: oThis.channelUserRelation.id,
      is_admin: Number(oThis.channelUserRelation.isAdmin),
      is_member: Number(oThis.channelUserRelation.isMember),
      uts: oThis.channelUserRelation.updatedAt
    });
  }
}

module.exports = ChannelUserRelationSingleFormatter;
