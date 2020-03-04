const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SessionAuthPayloadModel = require(rootPrefix + '/app/models/mysql/big/SessionAuthPayload'),
  SessionAuthNotificationPublisher = require(rootPrefix + '/lib/userNotificationPublisher/SessionAuth'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
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
    super();

    const oThis = this;

    oThis.payload = params.payload;
    oThis.currentUserId = +params.current_user.id;

    oThis.sessionAuthPayloadObj = null;
    oThis.pushNotificationEnabled = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._insertSessionAuthPayload();

    await oThis._createPushNotification();

    return responseHelper.successWithData(oThis.finalResponse());
  }

  /**
   * Add session auth payload.
   *
   * @sets oThis.sessionAuthPayloadObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertSessionAuthPayload() {
    const oThis = this;

    const insertData = {
      user_id: oThis.currentUserId,
      payload: oThis.payload,
      status: sessionAuthPayloadConstants.invertedStatuses[sessionAuthPayloadConstants.activeStatus]
    };

    const insertResponse = await new SessionAuthPayloadModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.sessionAuthPayloadObj = new SessionAuthPayloadModel().formatDbData(insertData);
    await SessionAuthPayloadModel.flushCache({ ids: [oThis.sessionAuthPayloadObj.id] });
  }

  /**
   * Create entry in notification hook table for push notification.
   *
   * @sets oThis.pushNotificationEnabled
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

    const resp = await new SessionAuthNotificationPublisher(publishParams).perform();

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
