/**
 * Formatter for Single Feed entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/feed/Single
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Feed formatter.
 *
 * @class
 */
class FeedSingleFormatter {
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
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.feed = params.feed;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const payload = oThis.feed.payload;

    return responseHelper.successWithData({
      id: oThis.feed.id,
      kind: oThis.feed.kind,
      status: oThis.feed.status,
      privacy_type: oThis.feed.privacyType,
      published_ts: oThis.feed.publishedTs,
      updated_at: oThis.feed.updatedAt,
      payload: {
        text: String(payload.text),
        ost_transaction_id: Number(payload.ostTransactionId),
        gif_id: String(payload.gifDetailId)
      }
    });
  }
}

module.exports = FeedSingleFormatter;
