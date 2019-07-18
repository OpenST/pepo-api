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

    console.log('params INSIDE FeedSingleFormatter======', params);

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

    console.log('1-----------------------==oThis.feed====', oThis.feed);
    const feedKeyConfig = {
      id: { isNullAllowed: false },
      kind: { isNullAllowed: false },
      publishedTs: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false },
      primaryExternalEntityId: { isNullAllowed: false },
      actor: { isNullAllowed: false },
      extraData: { isNullAllowed: true }
    };

    console.log('2-----------------------==feedKeyConfig====', feedKeyConfig);
    return oThis._validateParameters(oThis.feed, feedKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    console.log('4-----------------------======');
    let finalResp = {
      id: oThis.feed.id,
      kind: oThis.feed.kind,
      updated_at: oThis.feed.updatedAt,
      payload: {
        video_id: oThis.feed.primaryExternalEntityId,
        user_id: oThis.feed.actor
      }
    };
    console.log('5----------------------finalResp-======', finalResp);

    return responseHelper.successWithData(finalResp);
  }
}

module.exports = FeedSingleFormatter;
