const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Feed formatter.
 *
 * @class FeedSingleFormatter
 */
class FeedSingleFormatter extends BaseFormatter {
  /**
   * Constructor for Feed formatter.
   *
   * @param {object} params
   * @param {object} params.feed
   *
   * @param {number} params.feed.id
   * @param {string} params.feed.kind
   * @param {string} params.feed.status
   * @param {object} params.feed.privacyType
   * @param {number} params.feed.published_ts
   * @param {number} params.feed.updated_at
   * @param {object} params.feed.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.feed = params.feed;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const feedKeyConfig = {
      id: { isNullAllowed: false },
      kind: { isNullAllowed: false },
      status: { isNullAllowed: false },
      privacyType: { isNullAllowed: false },
      publishedTs: { isNullAllowed: true },
      displayTs: { isNullAllowed: true },
      updatedAt: { isNullAllowed: false },
      payload: { isNullAllowed: false }
    };

    const feedValidationResponse = oThis._validateParameters(oThis.feed, feedKeyConfig);

    if (feedValidationResponse.isFailure()) {
      return feedValidationResponse;
    }

    const feedPayloadKeyConfig = {
      text: { isNullAllowed: true },
      gifDetailId: { isNullAllowed: true },
      ostTransactionId: { isNullAllowed: false }
    };

    console.log('====oThis.feed.payload=====', oThis.feed.payload);
    console.log('====feedPayloadKeyConfig=====', feedPayloadKeyConfig);

    return oThis._validateParameters(oThis.feed.payload, feedPayloadKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    const payload = oThis.feed.payload;

    return responseHelper.successWithData({
      id: oThis.feed.id,
      kind: oThis.feed.kind,
      status: oThis.feed.status,
      privacy_type: oThis.feed.privacyType,
      display_ts: oThis.feed.displayTs,
      updated_at: oThis.feed.updatedAt,
      payload: {
        text: payload.text || '',
        ost_transaction_id: Number(payload.ostTransactionId),
        gif_id: payload.gifDetailId || ''
      }
    });
  }
}

module.exports = FeedSingleFormatter;
