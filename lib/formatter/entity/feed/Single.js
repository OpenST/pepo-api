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
   * @param {Object} params
   * @param {Object} params.feed
   *
   * @param {Integer} params.feed.id
   * @param {String} params.feed.kind
   * @param {String} params.feed.status
   * @param {Integer} params.feed.published_ts
   * @param {Integer} params.feed.updated_at
   * @param {Object} params.feed.payload
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
    let payload = oThis.feed.payload;

    return responseHelper.successWithData({
      id: oThis.feed.id,
      kind: oThis.feed.kind,
      status: oThis.feed.status,
      published_ts: oThis.feed.published_ts,
      updated_at: oThis.feed.updated_at,
      payload: {
        text: String(payload.text),
        ost_transaction_id: String(payload.ost_transaction_id),
        gif_detail_id: String(payload.gif_detail_id)
      }
    });
  }
}

module.exports = FeedSingleFormatter;
