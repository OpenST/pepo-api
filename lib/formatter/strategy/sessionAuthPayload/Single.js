const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class SessionAuthPayloadSingleFormatter extends BaseFormatter {
  /**
   * Constructor for SessionAuthPayloadSingleFormatter.
   *
   * @param {object} params
   * @param {object} params.sessionAuthPayload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.sessionAuthPayload = params.sessionAuthPayload;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const sessionAuthPayloadKeyConfig = {
      id: { isNullAllowed: false },
      userId: { isNullAllowed: false },
      payload: { isNullAllowed: false },
      status: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.sessionAuthPayload, sessionAuthPayloadKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.sessionAuthPayload.id,
      user_id: oThis.sessionAuthPayload.userId,
      payload: oThis.sessionAuthPayload.payload,
      status: oThis.sessionAuthPayload.status,
      uts: oThis.sessionAuthPayload.updatedAt
    });
  }
}

module.exports = SessionAuthPayloadSingleFormatter;
