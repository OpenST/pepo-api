const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Constructor for FeedVideoView.
 *
 * @class FeedVideoView
 */
class FeedVideoView {
  /**
   * Constructor for FeedVideoView.
   *
   * @augments FeedVideoView
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    logger.log('FeedVideoView===========', params);
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    return responseHelper.successWithData({});
  }
}

module.exports = FeedVideoView;
