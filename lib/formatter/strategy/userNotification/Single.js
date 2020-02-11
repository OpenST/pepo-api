const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const payloadKeyMap = {
  thankYouText: 'thank_you_text',
  thankYouFlag: 'thank_you_flag',
  thankYouUserId: 'thank_you_user_id',
  amount: 'amount',
  videoId: 'video_id',
  pepocornAmount: 'pepocorn_amount',
  replyDetailId: 'reply_detail_id',
  parentVideoId: 'parent_video_id',
  url: 'url',
  dynamicText: 'dynamic_text',
  channelId: 'channel_id'
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

    oThis.userNotification = util.clone(params.userNotification);
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
      imageId: { isNullAllowed: true },
      timestamp: { isNullAllowed: false },
      payload: { isNullAllowed: true },
      heading: { isNullAllowed: false },
      goto: { isNullAllowed: false }
    };

    let validationResponse = oThis.validateParameters(oThis.userNotification, userNotificationKeyConfig);

    if (validationResponse.isFailure()) {
      return validationResponse;
    }

    let resp = oThis._sanitizePayload();

    if (resp.isFailure()) {
      return resp;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input payload.
   *
   * @returns {*|result}
   * @private
   */
  _sanitizePayload() {
    const oThis = this;

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

    oThis.userNotification.payload = formattedPayload;
    return responseHelper.successWithData({});
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
      goto: oThis.userNotification.goto,
      image_id: oThis.userNotification.imageId,
      timestamp: oThis.userNotification.timestamp,
      payload: oThis.userNotification.payload,
      uts: oThis.userNotification.timestamp
    });
  }
}

module.exports = UserNotificationSingleFormatter;
