const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  BlockUserService = require(rootPrefix + '/app/services/admin/BlockUser');

/**
 * Class to process block user event.
 *
 * @class BlockUser
 */
class BlockUser extends SlackEventBase {
  /**
   * Constructor to process block user event.
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

    await oThis._callBlockUserService();

    return responseHelper.successWithData({});
  }

  /**
   * Call block user service
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callBlockUserService() {
    const oThis = this,
      blockUserServiceResponseParams = {
        user_ids: [oThis.eventParams.user_id],
        current_admin: oThis.currentAdmin
      };

    let BlockUserServiceResponse = await new BlockUserService(blockUserServiceResponseParams).perform();

    if (BlockUserServiceResponse.isFailure()) {
      return Promise.reject(BlockUserServiceResponse);
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

    const txt = await oThis._textToWrite('User Deleted');
    const newElement = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: txt
        }
      ]
    };

    newBlocks[actionPos] = newElement;
    return newBlocks;
  }
}

module.exports = BlockUser;
