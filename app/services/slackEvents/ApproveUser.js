const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ApproveUsersAsCreatorService = require(rootPrefix + '/app/services/admin/ApproveUsersAsCreator'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class to process approve user event.
 *
 * @class ApproveUser
 */
class ApproveUser extends SlackEventBase {
  /**
   * Constructor to process approve user event.
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

    await oThis._callApproveUserService();

    return responseHelper.successWithData({});
  }

  /**
   * Call approve user service
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callApproveUserService() {
    const oThis = this,
      approveUserServiceParams = {
        user_ids: [oThis.eventParams.user_id],
        current_admin: oThis.currentAdmin
      };

    let approveUserServiceResponse = await new ApproveUsersAsCreatorService(approveUserServiceParams).perform();

    if (approveUserServiceResponse.isFailure()) {
      return Promise.reject(approveUserServiceResponse);
    } else {
      return oThis._postResponseToSlack();
    }
  }

  async _postResponseToSlack() {
    const oThis = this;
    return responseHelper.successWithData({});
  }
}

module.exports = ApproveUser;
