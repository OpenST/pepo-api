const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserNotificationSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/userNotification/Single');

/**
 * Class for User Notifications entity to convert keys to snake case.
 *
 * @class UserNotificationListFormatter
 */
class UserNotificationListFormatter extends BaseFormatter {
  /**
   * Constructor for userNotification list formatter.
   *
   * @param {object} params
   * @param {array} params.userNotificationList
   *
   * @param {number} params.userNotification.id
   * @param {string} params.userNotification.kind
   * @param {string} params.userNotification.status
   * @param {number} params.userNotification.published_ts
   * @param {number} params.userNotification.updated_at
   * @param {object} params.userNotification.payload
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userNotificationList = params.userNotificationList;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.userNotificationList)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_un_l_1',
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

    for (let index = 0; index < oThis.userNotificationList.length; index++) {
      const formattedRsp = new UserNotificationSingleFormatter({
        userNotification: oThis.userNotificationList[index]
      }).perform();

      if (formattedRsp.isFailure()) {
        return formattedRsp;
      }

      finalResponse.push(formattedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserNotificationListFormatter;
