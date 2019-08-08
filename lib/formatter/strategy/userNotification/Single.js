const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for userNotification formatter.
 *
 * @class userNotificationSingleFormatter
 */
class UserNotificationSingleFormatter extends BaseFormatter {
  /**
   * Constructor for userNotification formatter.
   *
   * @param {object} params
   * @param {object} params.userNotification
   *
   * @param {number} params.userNotification.id
   * @param {string} params.userNotification.kind
   * @param {number} params.userNotification.published_ts
   * @param {number} params.userNotification.timestamp
   * @param {object} params.userNotification.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userNotification = params.userNotification;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userNotificationKeyConfig = {
      id: { isNullAllowed: false },
      kind: { isNullAllowed: false },
      imageId: { isNullAllowed: false },
      timestamp: { isNullAllowed: false },
      payload: { isNullAllowed: true },
      heading: { isNullAllowed: false },
      goto: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.userNotification, userNotificationKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.userNotification.id,
      kind: oThis.userNotification.kind,
      heading: oThis.userNotification.heading,
      goto: oThis.userNotification.heading,
      image_id: oThis.userNotification.imageId,
      timestamp: oThis.userNotification.timestamp,
      payload: oThis.userNotification.payload,
      uts: oThis.userNotification.timestamp
    });
  }
}

module.exports = UserNotificationSingleFormatter;
