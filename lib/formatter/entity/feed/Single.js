/**
 * Formatter for Single Feed entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/feed/Single
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const has = Object.prototype.hasOwnProperty; // Cache the lookup once, in module scope.

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
   * Perform.
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    if (
      !has.call(oThis.feed, 'id') ||
      !has.call(oThis.feed, 'kind') ||
      !has.call(oThis.feed, 'status') ||
      !has.call(oThis.feed, 'publishedTs') ||
      !has.call(oThis.feed, 'updatedAt') ||
      !has.call(oThis.feed, 'payload') ||
      !has.call(oThis.feed.payload, 'text') ||
      !has.call(oThis.feed.payload, 'ostTransactionId')
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_f_e_f_s_1',
          api_error_identifier: 'entity_formatting_failed',
          debug_options: { feedParams: oThis.feed }
        })
      );
    }

    const payload = oThis.feed.payload;

    return responseHelper.successWithData({
      id: oThis.feed.id,
      kind: oThis.feed.kind,
      status: oThis.feed.status,
      privacy_type: oThis.feed.privacyType,
      published_ts: oThis.feed.publishedTs,
      updated_at: oThis.feed.updatedAt,
      payload: {
        text: payload.text ? String(payload.text) : '',
        ost_transaction_id: Number(payload.ostTransactionId),
        gif_id: payload.gifDetailId ? String(payload.gifDetailId) : ''
      }
    });
  }
}

module.exports = FeedSingleFormatter;
