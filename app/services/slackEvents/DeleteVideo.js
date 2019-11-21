const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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
      return Promise.reject(DeleteVideoServiceResponse);
    } else {
      return oThis._postResponseToSlack();
    }
  }

  async _postResponseToSlack() {
    const oThis = this;

    return super._postResponseToSlack();
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

    delete newBlocks[actionPos]['accessory'];

    newBlocks[actionPos]['text']['text'] += +oThis._textToWrite('\nDeleted');

    return newBlocks;
  }
}

module.exports = DeleteVideo;
