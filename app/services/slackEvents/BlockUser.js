const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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
    return responseHelper.successWithData({});
  }
}

module.exports = BlockUser;
