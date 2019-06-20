const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserFeedSingleFormatter = require(rootPrefix + '/lib/formatter/entity/userFeed/Single');

/**
 * Class for User Feeds entity to convert keys to snake case.
 *
 * @class UserFeedsListFormatter
 */
class UserFeedsListFormatter extends BaseFormatter {
  /**
   * Constructor for User Feeds entity to convert keys to snake case.
   *
   * @param {object} params
   * @param {array} params.feedIds
   * @param {object} params.userFeedIdToFeedDetailsMap
   * @param {object} params.feedIdToFeedDetailsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.feedIds = params.feedIds;
    oThis.userFeedIdToFeedDetailsMap = params.userFeedIdToFeedDetailsMap;
    oThis.feedIdToFeedDetailsMap = params.feedIdToFeedDetailsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.feedIds)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_uf_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = [];

    for (let index = 0; index < oThis.feedIds.length; index++) {
      const userFeedId = oThis.feedIds[index],
        userFeedObj = oThis.userFeedIdToFeedDetailsMap[userFeedId],
        feedObj = oThis.feedIdToFeedDetailsMap[userFeedId];

      const formattedFeedRsp = new UserFeedSingleFormatter({ feed: feedObj, userFeed: userFeedObj }).perform();

      if (formattedFeedRsp.isFailure()) return formattedFeedRsp;

      finalResponse.push(formattedFeedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserFeedsListFormatter;
