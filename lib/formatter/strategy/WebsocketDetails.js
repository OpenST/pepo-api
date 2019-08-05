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
   * @param {object} params.websocketConnectionPayload
   *
   * @param {string} params.websocketConnectionPayload.id
   * @param {string} params.websocketConnectionPayload.uts
   * @param {string} params.websocketConnectionPayload.socketEndPoint
   * @param {string} params.websocketConnectionPayload.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.websocketConnectionPayload = params.websocketConnectionPayload;
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
      id: { isNullAllowed: false },
      uts: { isNullAllowed: false },
      socketEndPoint: { isNullAllowed: false },
      payload: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.websocketConnectionPayload, deviceKeyConfig);
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
      id: oThis.websocketConnectionPayload.id,
      uts: oThis.websocketConnectionPayload.uts,
      socket_end_point: oThis.websocketConnectionPayload.socketEndPoint,
      payload: oThis.websocketConnectionPayload.payload
    });
  }
}

module.exports = WebsocketDetails;
