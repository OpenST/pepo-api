const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');
DeleteVideoService = require(rootPrefix + '/app/services/admin/DeleteVideo');

/**
 * Class to process delete video event.
 *
 * @class DeleteVideo
 */
class DeleteVideo extends SlackEventBase {
  /**
   * Constructor to process delete video event.
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

    await oThis._callDeleteVideoService();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Call delete video service
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callDeleteVideoService() {
    const oThis = this,
      deletevideoServiceParams = {
        video_id: oThis.eventParams.video_id,
        current_admin: oThis.currentAdmin
      };

    let DeleteVideoServiceResponse = await new DeleteVideoService(deletevideoServiceParams).perform();

    if (DeleteVideoServiceResponse.isFailure()) {
      oThis._setError(DeleteVideoServiceResponse);
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

module.exports = DeleteVideo;
