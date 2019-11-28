const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  DeleteUserService = require(rootPrefix + '/app/services/admin/DeleteUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class to process delete user event.
 *
 * @class DeleteUser
 */
class DeleteUser extends SlackEventBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._callDeleteUserService();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Call delete user service.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callDeleteUserService() {
    const oThis = this;

    const DeleteUserServiceResponseParams = {
      user_ids: [oThis.eventParams.user_id],
      current_admin: oThis.currentAdmin
    };

    const DeleteUserServiceResponse = await new DeleteUserService(DeleteUserServiceResponseParams).perform();

    if (DeleteUserServiceResponse.isFailure()) {
      oThis._setError(DeleteUserServiceResponse);
    }
  }

  /**
   * Update payload for slack post request.
   *
   * @param {number} actionPos
   * @param {array} newBlocks
   *
   * @returns {Promise<array>}
   * @private
   */
  async _updatedBlocks(actionPos, newBlocks) {
    const oThis = this;

    logger.log('_updateBlocks start');

    if (oThis.errMsg) {
      const formattedMsg = '`error:`' + oThis.errMsg;

      const trailingArray = newBlocks.splice(actionPos + 1);

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

module.exports = DeleteUser;
