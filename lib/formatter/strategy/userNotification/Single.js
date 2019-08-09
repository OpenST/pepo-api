const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const payloadKeyMap = {
  thankYouText: 'thank_you_text',
  amount: 'amount',
  videoId: 'video_id'
};

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

    oThis.userNotification = JSON.parse(JSON.stringify(params.userNotification));
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

    let validationResponse = oThis.validateParameters(oThis.userNotification, userNotificationKeyConfig);

    if (validationResponse.isFailure()) {
      return validationResponse;
    }

    return oThis._sanitizePayload();
  }

  /**
   * Format the input payload.
   *
   * @returns {*|result}
   * @private
   */
  _sanitizePayload() {
    let formattedPayload = {};
    const payload = oThis.userNotification.payload || {};

    for (const key in payload) {
      let formattedKey = null;
      formattedKey = payloadKeyMap[key];

      if (formattedKey == undefined) {
        return responseHelper.error({
          internal_error_identifier: 'l_f_s_un_s_f_1',
          api_error_identifier: 'entity_formatting_failed',
          debug_options: {
            userNotification: oThis.userNotification,
            key: key,
            payloadKeyMap: payloadKeyMap
          }
        });
      }

      formattedPayload[formattedKey] = payload[key];
    }

    oThis.userNotification.payload = payload;
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
