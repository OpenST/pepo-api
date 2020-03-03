const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SessionAuthPayloadModel = require(rootPrefix + '/app/models/mysql/big/SessionAuthPayload'),
  SessionAuthNotificationPublisher = require(rootPrefix + '/lib/userNotificationPublisher/SessionAuth'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage'),
  sessionAuthPayloadConstants = require(rootPrefix + '/lib/globalConstant/big/sessionAuthPayload');

/**
 * Class to add session auth and send notification.
 *
 * @class PostSessionAuth
 */
class PostSessionAuth extends ServiceBase {
  /**
   * Constructor to get user profile.
   *
   * @param {object} params
   * @param {string} params.payload
   * @param {object} params.current_user
   * @param {string/number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.payload = params.payload;
    oThis.currentUserId = +params.current_user.id;

    oThis.sessionAuthPayloadObj = null;
    oThis.pushNotificationEnabled = null;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._insertSessionAuthPayload();

    await oThis._createPushNotification();

    return responseHelper.successWithData(oThis.finalResponse());
  }

  /**
   * Add session Auth payload.
   *
   * @return {Promise<void>}
   * @private
   */
  async _insertSessionAuthPayload() {
    const oThis = this;

    let insertData = {
      user_id: oThis.currentUserId,
      payload: oThis.payload,
      status: sessionAuthPayloadConstants.invertedStatuses[sessionAuthPayloadConstants.activeStatus]
    };

    let insertResponse = await new SessionAuthPayloadModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.sessionAuthPayloadObj = new SessionAuthPayloadModel().formatDbData(insertData);
    await SessionAuthPayloadModel.flushCache(oThis.sessionAuthPayloadObj);
  }

  /**
   * Create entry in notification hook table for push notification.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createPushNotification() {
    const oThis = this;

    const publishParams = {
      userId: oThis.currentUserId,
      sessionAuthPayloadId: oThis.sessionAuthPayloadObj.id
    };

    let resp = await new SessionAuthNotificationPublisher(publishParams).perform();

    oThis.pushNotificationEnabled = resp.isSuccess() && resp.data.push_notification_created ? 1 : 0;
  }

  /**
   * Service response.
   *
   * @returns {object}
   * @private
   */
  finalResponse() {
    const oThis = this;

    const deepLinkUrl = webPageConstants._sessionAuthLink(oThis.sessionAuthPayloadObj.id);

    return {
      deepLinkUrl: deepLinkUrl,
      pushNotificationEnabled: oThis.pushNotificationEnabled,
      [entityTypeConstants.sessionAuthPayload]: oThis.sessionAuthPayloadObj
    };
  }
}

module.exports = PostSessionAuth;
