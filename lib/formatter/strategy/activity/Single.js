const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Activity formatter.
 *
 * @class ActivitySingleFormatter
 */
class ActivitySingleFormatter extends BaseFormatter {
  /**
   * Constructor for Activity formatter.
   *
   * @param {object} params
   * @param {object} params.activity
   *
   * @param {number} params.activity.id
   * @param {string} params.activity.kind
   * @param {string} params.activity.status
   * @param {number} params.activity.published_ts
   * @param {number} params.activity.updated_at
   * @param {object} params.activity.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.activity = params.activity;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const activityKeyConfig = {
      id: { isNullAllowed: false },
      entityType: { isNullAllowed: false },
      status: { isNullAllowed: false },
      publishedTs: { isNullAllowed: true },
      displayTs: { isNullAllowed: true },
      updatedAt: { isNullAllowed: false },
      payload: { isNullAllowed: false }
    };

    const activityValidationResponse = oThis.validateParameters(oThis.activity, activityKeyConfig);

    if (activityValidationResponse.isFailure()) {
      return activityValidationResponse;
    }

    const activityPayloadKeyConfig = {
      text: { isNullAllowed: true },
      gifDetailId: { isNullAllowed: true },
      ostTransactionId: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.activity.payload, activityPayloadKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    const payload = oThis.activity.payload;

    return responseHelper.successWithData({
      id: oThis.activity.id,
      entityType: oThis.activity.entityType,
      status: oThis.activity.status,
      display_ts: oThis.activity.displayTs,
      uts: oThis.activity.updatedAt,
      payload: {
        text: payload.text || '',
        ost_transaction_id: Number(payload.ostTransactionId),
        gif_id: payload.gifDetailId || ''
      }
    });
  }
}

module.exports = ActivitySingleFormatter;
