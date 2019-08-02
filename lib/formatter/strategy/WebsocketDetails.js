const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for websocket details formatter.
 *
 * @class WebsocketDetails
 */
class WebsocketDetails extends BaseFormatter {
  /**
   * Constructor for device formatter.
   *
   * @param {object} params
   * @param {object} params.websocketDetails
   *
   * @param {string} params.websocketDetails.userId
   * @param {string} params.websocketDetails.socketEndpoint
   * @param {string} params.websocketDetails.authKey
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.websocketDetails = params.websocketDetails;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const deviceKeyConfig = {
      userId: { isNullAllowed: false },
      socketEndpoint: { isNullAllowed: false },
      authKey: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.websocketDetails, deviceKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      user_id: oThis.websocketDetails.userId,
      socket_end_point: oThis.websocketDetails.socketEndpoint,
      auth_key: oThis.websocketDetails.authKey
    });
  }
}

module.exports = WebsocketDetails;
