const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for JoinZoomMeetingPayload formatter.
 *
 * @class JoinZoomMeetingPayloadFormatter
 */
class JoinZoomMeetingPayloadFormatter extends BaseFormatter {
  /**
   * Constructor for JoinZoomMeetingPayload formatter.
   *
   * @param {object} params
   * @param {object} params.joinZoomMeetingPayload
   *
   * @param {number} params.joinZoomMeetingPayload.zoomMeetingId
   * @param {string} params.joinZoomMeetingPayload.signature
   * @param {string} params.joinZoomMeetingPayload.name
   * @param {string} params.joinZoomMeetingPayload.profile_pic_url
   * @param {number} params.joinZoomMeetingPayload.role
   * @param {string} params.joinZoomMeetingPayload.api_key
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.joinZoomMeetingPayload = params.joinZoomMeetingPayload;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const joinZoomMeetingPayloadKeyConfig = {
      zoomMeetingId: { isNullAllowed: false },
      signature: { isNullAllowed: false },
      name: { isNullAllowed: true },
      profile_pic_url: { isNullAllowed: true },
      role: { isNullAllowed: false },
      api_key: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.joinZoomMeetingPayload, joinZoomMeetingPayloadKeyConfig);
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
      zoomMeetingId: oThis.joinZoomMeetingPayload.zoomMeetingId,
      signature: oThis.joinZoomMeetingPayload.signature,
      name: oThis.joinZoomMeetingPayload.name,
      profile_pic_url: oThis.joinZoomMeetingPayload.profile_pic_url,
      role: oThis.joinZoomMeetingPayload.role,
      api_key: oThis.joinZoomMeetingPayload.api_key
    });
  }
}

module.exports = JoinZoomMeetingPayloadFormatter;
