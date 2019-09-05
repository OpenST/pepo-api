const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for invite user search result formatter.
 *
 * @class InviteUserSearchSingleFormatter
 */
class InviteUserSearchSingleFormatter extends BaseFormatter {
  /**
   * Constructor for invite user search formatter.
   *
   * @param {object} params
   * @param {object} params.inviteUserSearchResult
   *
   * @param {number} params.inviteUserSearchResult.id
   * @param {number} params.inviteUserSearchResult.updated_at
   * @param {object} params.inviteUserSearchResult.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.inviteUserSearchResult = params.inviteUserSearchResult;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const inviteUserSearchKeyConfig = {
      id: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.inviteUserSearchResult, inviteUserSearchKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    let response = {
      id: oThis.inviteUserSearchResult.inviteId,
      uts: oThis.inviteUserSearchResult.updatedAt,
      payload: {
        invite_id: oThis.inviteUserSearchResult.inviteId
      }
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = InviteUserSearchSingleFormatter;
