const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  DeleteReplyService = require(rootPrefix + '/app/services/admin/reply/Delete'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class to process delete reply event.
 *
 * @class DeleteReply
 */
class DeleteReply extends SlackEventBase {
  /**
   * Constructor to process delete reply event.
   *
   * @param {object} params
   * @param {object} params.eventParams: event params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.errMsg = null;
  }

  /**
   * Perform - Process Slack Event.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._callDeleteReplyService();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Call delete reply service
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callDeleteReplyService() {
    const oThis = this,
      deleteReplyServiceParams = {
        reply_details_id: oThis.eventParams.reply_detail_id,
        current_admin: oThis.currentAdmin
      };

    let DeleteReplyServiceResponse = await new DeleteReplyService(deleteReplyServiceParams).perform();

    if (DeleteReplyServiceResponse.isFailure()) {
      oThis._setError(DeleteReplyServiceResponse);
    }
  }

  /**
   * Update Payload for slack post request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _updatedBlocks(actionPos, newBlocks) {
    const oThis = this;
    logger.log('_updateBlocks start');

    if (oThis.errMsg) {
      const txt = '\n`error:`' + oThis.errMsg;
      newBlocks[actionPos]['text']['text'] += txt;
    } else {
      const txt = await oThis._textToWrite('Deleted');

      delete newBlocks[actionPos]['accessory'];

      newBlocks[actionPos]['text']['text'] += txt;
    }

    return newBlocks;
  }
}

module.exports = DeleteReply;
