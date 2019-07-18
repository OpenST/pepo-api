const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserProfileSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/userProfile/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user profile map formatter.
 *
 * @class userProfileMapFormatter
 */
class userProfileMapFormatter extends BaseFormatter {
  /**
   * Constructor for videos map formatter.
   *
   * @param {object} params
   * @param {object} params.userProfilesMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userProfilesMap = params.userProfilesMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.userProfilesMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_up_m_1',
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

    const finalResponse = {};

    for (const userProfileId in oThis.userProfilesMap) {
      const userProfileObj = oThis.userProfilesMap[userProfileId],
        formattedUserProfilesRsp = new UserProfileSingleFormatter({ userProfile: userProfileObj }).perform();

      if (formattedUserProfilesRsp.isFailure()) {
        return formattedUserProfilesRsp;
      }

      finalResponse[userProfileId] = formattedUserProfilesRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = userProfileMapFormatter;
