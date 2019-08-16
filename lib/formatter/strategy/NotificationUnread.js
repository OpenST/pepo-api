const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for notification unread formatter.
 *
 * @class NotificationUnread
 */
class NotificationUnread extends BaseFormatter {
  /**
   * Constructor for notification unread formatter.
   *
   * @param {object} params
   * @param {object} params.notificationUnread
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.notificationUnread = params.notificationUnread;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const notificationKeyConfig = { notificationUnread: { isNullAllowed: false } };

    return oThis.validateParameters({ notificationUnread: oThis.notificationUnread }, notificationKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      notification_unread: oThis.notificationUnread
    });
  }
}

module.exports = NotificationUnread;
