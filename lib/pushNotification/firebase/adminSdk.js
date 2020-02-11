const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  firebaseProvider = require(rootPrefix + '/lib/providers/firebase');

/**
 * Class for firebase admin SDK.
 *
 * @class FirebaseAdminSDK
 */
class FirebaseAdminSDK {
  /**
   * Initialize firebase object.
   *
   * @sets oThis.firebaseObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initializeFireBaseObj() {
    const oThis = this;

    oThis.firebaseObj = await firebaseProvider.getInstance();
  }

  /**
   * Sends the given multicast message to all the FCM registration tokens specified in it.
   *
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-multicast
   *
   * @param {array<string>} registrationTokens
   * @param {object} messageParams
   *
   * @returns {Promise<*>}
   */
  async sendMulticastNotification(registrationTokens, messageParams) {
    const oThis = this;

    if (!oThis.firebaseObj) {
      await oThis._initializeFireBaseObj();
    }

    const multicastMessage = Object.assign(messageParams, { tokens: registrationTokens });

    logger.log(
      'multicastMessage ========',
      multicastMessage,
      '========= Size:',
      JSON.stringify(multicastMessage).length
    );

    return oThis.firebaseObj
      .messaging()
      .sendMulticast(multicastMessage)
      .catch(function(err) {
        logger.log('err from admin sdk ====', err);

        return oThis._errorResponseHandler(err);
      });
  }

  /**
   * Sends the given message via FCM.
   *
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send
   *
   * @param {string} registrationToken
   * @param {object} messageParams
   *
   * @returns {Promise<*>}
   */
  async sendNotification(registrationToken, messageParams) {
    const oThis = this;

    if (!oThis.firebaseObj) {
      await oThis._initializeFireBaseObj();
    }

    const message = Object.assign(messageParams, { tokens: registrationToken });

    logger.log('message =========================', message, typeof message);

    const sendNotificationRsp = await oThis.firebaseObj
      .messaging()
      .send(message)
      .catch(function(err) {
        logger.error('err from admin sdk =========================', err);

        return oThis._errorResponseHandler(err);
      });

    logger.log('sendNotificationRsp =========================', sendNotificationRsp);

    if (sendNotificationRsp) {
      return oThis._successResponseHandler(sendNotificationRsp);
    }

    return oThis._errorResponseHandler(sendNotificationRsp);
  }

  /**
   * Sends all the messages in the given array.
   *
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#sendall
   *
   * @param {array} messages
   *
   * @returns {Promise<*>}
   */
  async sendAllNotification(messages) {
    const oThis = this;

    if (!oThis.firebaseObj) {
      await oThis._initializeFireBaseObj();
    }
    logger.log(' ==========messages===============', JSON.stringify(messages));
    const sendAllNotificationRsp = await oThis.firebaseObj
      .messaging()
      .sendAll(messages)
      .catch(function(err) {
        logger.error('err from admin sdk =========================', err);

        return oThis._errorResponseHandler(err);
      });

    logger.log('sendAllNotificationRsp =========================', sendAllNotificationRsp);

    if (sendAllNotificationRsp) {
      return oThis._successResponseHandler(sendAllNotificationRsp);
    }

    return oThis._errorResponseHandler(sendAllNotificationRsp);
  }

  /**
   * Error response handler for sdk result obj.
   *
   * @param {object} error
   *
   * @returns {*}
   * @private
   */
  async _errorResponseHandler(error) {
    logger.error('_errorResponseHandler----------', error);

    let errorObj = null;

    if (responseHelper.isCustomResult(error)) {
      errorObj = error;
    } else {
      errorObj = responseHelper.error({
        internal_error_identifier: 'l_pn_f_as_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: JSON.stringify(error), stack: error.stack }
      });
    }

    /* Uncomment when needed.
     await createErrorLogsEntry.perform(errorObj, errorLogsConstants.mediumSeverity);
    */

    return Promise.reject(errorObj);
  }

  /**
   * Success response handler for sdk result obj.
   *
   * @param {object} successData
   *
   * @returns {*|result}
   * @private
   */
  _successResponseHandler(successData) {
    return responseHelper.successWithData(successData);
  }
}

module.exports = new FirebaseAdminSDK();
