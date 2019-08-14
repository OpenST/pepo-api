const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User search result formatter.
 *
 * @class UserSearchSingleFormatter
 */
class UserSearchSingleFormatter extends BaseFormatter {
  /**
   * Constructor for user search formatter.
   *
   * @param {object} params
   * @param {object} params.userSearchResult
   *
   * @param {number} params.userSearchResult.id
   * @param {number} params.userSearchResult.updated_at
   * @param {object} params.userSearchResult.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userSearchResult = params.userSearchResult;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userSearchKeyConfig = {
      id: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.userSearchResult, userSearchKeyConfig);
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
      id: oThis.userSearchResult.id,
      uts: oThis.userSearchResult.updatedAt,
      payload: {
        user_id: oThis.userSearchResult.userId
      }
    };

    if (oThis.userSearchResult.hasOwnProperty('videoId')) {
      response['payload']['video_id'] = oThis.userSearchResult.videoId;
    }

    return responseHelper.successWithData(response);
  }
}

module.exports = UserSearchSingleFormatter;
