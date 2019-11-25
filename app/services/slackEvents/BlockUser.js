const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  BlockUserService = require(rootPrefix + '/app/services/admin/BlockUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

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

    await oThis._callBlockUserService();

    await oThis._postResponseToSlack();

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
      oThis._setError(BlockUserServiceResponse);
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
      const formattedMsg = '`error:`' + oThis.errMsg;

      let trailingArray = newBlocks.splice(actionPos + 1);

      newBlocks[actionPos + 1] = slackConstants.addTextSection(formattedMsg);
      newBlocks = newBlocks.concat(trailingArray);
    } else {
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
    }

    return newBlocks;
  }
}

module.exports = BlockUser;
