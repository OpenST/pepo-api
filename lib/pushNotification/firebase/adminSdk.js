const fireBaseAdminSDK = require('firebase-admin');

const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

let fireBaseAdmin;

class FirebaseAdminSDK {
  /**
   * Initialize Firebase Admin SDK Object.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initializeFireBaseObj() {
    const oThis = this;

    // TODO - @dhananjay -move to some other location.
    const firebaseConfig = {
      type: 'service_account',
      project_id: 'pepo2-18368',
      private_key_id: '7e73cc2e906e0ab551abe9454e7d4001ca32dfb7',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDqZ24jHcoH2h38\nLaWOcThpQvSM4ChyJxelvPoDP2ehcVGgYQX+wTfbwxq8+3BETZmrM+dDFYxxN15u\nrpT7pDOhoJpe0gxk+spn/arrw3q0vgGpq3MEWjem6hg2W3wxzNSLa00Uif8LJTf5\n0G0L/K+9cCCyiVNuQMdy1lA6yiofWTF8JOH1ASxuEBqoR4QIVk1tmuLxhc2weVcK\nXiHqJ3P0S1XSd6aX7aNgX0axwMERNN0LsghLuofBEmpV1BEVwLAgDzpTL3iguyxf\nbFXMf+74JlJD5BF722/LUMj7ymHq6zPvtefcL1VMeMa02RC0v7iDM8oPYmUCJU6S\nfmtKclatAgMBAAECggEASq3UJYT2mkTP+8lRLw38QnDt97nsuN2ih4+q+YDoU8OG\nFXoDznOhh7bjnGThEinE9Qnuum0xltpkkA+38GoSdwJzXBVAlKVf+fyTyVQ4kj/c\nyMESPkc95sQ7HYpNCZKv/pEbeBk088iSSlkwfLqvBMQl7quYtI4X3QrRecFx5RVJ\n2f4z3vARbc8ASdeP2T5gK/w5KuCbDMoE3mIYGVbjd/9aoQWb3Bt8DbGRcHti2PYZ\ns9133XuYdKIm+/DbXU6OCFkcqSUwUxXEe8bOAvkD3fpyWiZDgLt1LL0KyAzJDXyb\nj01yJnGmZLyJeRQWUfJN6a02TWfhTw+tUuc8YVjggwKBgQD/MI2UgBYIINOlW7ze\nQZEiAqNl5sze24ZtCOtPRCws7jcHIOLx6BrUayBM6Rr6L7uAzPn8ngfPd3vVo9Sq\nJrCu+Mdfo+7FA+JdozZizs734HXUW2ueSzIcMPMkPSjCjaPc17WIxrWpJvaAcCzD\nvpGz9bNA6zwRLcCSZelNHX2IZwKBgQDrJfrysCUsh71UocZLTmDb0OxHuXRKpGhM\nHjZ/8ZmyIsDiFrlDTupwb+O8MN3kAhtd5o+8Pb62M0c+5iUZs2uy96IhcE0lj70r\nuhebMaPcP14k3/jqxR9G4tfQ+wiTUJSjVr1zz+p5XRHXETavCR12FQaQstU4LROF\nTlLVFOdLywKBgH76R9iWi1/sBaQIK8hj07Wannd8CoDxtsfWYlAE2f5ZYiQ35vT7\nyy3bSC086GGJEsGaPOHIOJaxG3tIk+8+ZTgLLhmW1p5NunthVRSBV1bb54WNH9Wa\nEQsaCEIF9JwqIlknNHskdQwACTQLnRqhXpqvLUymQDNEEshF0Xq/q9ENAoGAac6o\nMWVjBLt7TMaSRDZbTO2gM9HV6vQ5Xe7GVSGwJ8CNi+3vpMKwqLEgBwDyBvOPvtvM\n10XtN2yxZTMHhJ4AGwJkOKmgfQNFepR8pL9cXPFCelMxXOof3bSaqZUbUbYTe7++\n9Yqblcp0CZLcSTxPvl9NmfRuDp3xx6zrhqemP6sCgYBk3ml70tfwm26Rp6NMzfgA\n8FqxnlM5OYx5WTUsUVCZVYDRpYlaqea6vcXyBJoxSlfI7qNZc2Nhl+kxE72mxN3/\ngaRZVCAzqEUjfJ1HCW3p/DhBcLSNeB4tysFh+mAc3G9WG8ThOeFQr4XyV0Vr3uaB\nmx0ZICnRDQSLLJDxSahReA==\n-----END PRIVATE KEY-----\n',
      client_email: 'firebase-adminsdk-3c7jx@pepo2-18368.iam.gserviceaccount.com',
      client_id: '102062276665744125076',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-3c7jx%40pepo2-18368.iam.gserviceaccount.com'
    };

    fireBaseAdmin = fireBaseAdminSDK.initializeApp({
      credential: fireBaseAdminSDK.credential.cert(firebaseConfig),
      databaseURL: 'https://pepo2-18368.firebaseio.com' // move to some other location.
    });
  }

  /**
   * Sends the given message via FCM.
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send
   *
   * @param registrationToken
   * @param data
   * @returns {Promise<*>}
   */
  async sendNotification(registrationToken, data) {
    const oThis = this;

    console.log('registrationToken ======', registrationToken);
    console.log('message ======', data, typeof data);

    if (!fireBaseAdmin) {
      await oThis._initializeFireBaseObj();
    }

    let message = {
      data: data,
      token: registrationToken
    };

    let sendNotificationRsp = await fireBaseAdmin
      .messaging()
      .send(message)
      .catch(function(err) {
        logger.error('err from admin sdk ====', err);
        return oThis._errorResponseHandler(err);
      });

    logger.log('\nsendNotificationRsp-----------------------', sendNotificationRsp);

    if (sendNotificationRsp && sendNotificationRsp.success) {
      return oThis._successResponseHandler(sendNotificationRsp.data);
    }

    return oThis._errorResponseHandler(sendNotificationRsp);
  }

  /**
   * Sends all the messages in the given array
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#sendall
   *
   * @param registrationToken
   * @param messages
   * @returns {Promise<*>}
   */
  async sendAllNotification(registrationToken, messages) {
    const oThis = this;

    if (!fireBaseAdmin) {
      await oThis._initializeFireBaseObj();
    }

    let params = {
      data: messages,
      token: registrationToken
    };

    let sendAllNotificationRsp = await fireBaseAdmin
      .messaging()
      .sendAll(params)
      .catch(function(err) {
        return oThis._errorResponseHandler(err);
      });

    if (sendAllNotificationRsp) {
      return oThis._successResponseHandler(sendAllNotificationRsp.data);
    }

    return oThis._errorResponseHandler(sendAllNotificationRsp);
  }

  /**
   * Sends the given multicast message to all the FCM registration tokens specified in it.
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-multicast
   *
   * @param registrationTokens
   * @param messageParams
   * @returns {Promise<*>}
   */
  async sendMulticastNotification(registrationTokens, messageParams) {
    const oThis = this;

    if (!fireBaseAdmin) {
      await oThis._initializeFireBaseObj();
    }

    let message = Object.assign(messageParams, { tokens: registrationTokens });

    console.log('\nmessage =========================', message, typeof message);

    let sendMulticastNotificationRsp = await fireBaseAdmin
      .messaging()
      .sendMulticast(message)
      .catch(function(err) {
        console.log('err from admin sdk ====', err);
        return oThis._errorResponseHandler(err);
      });

    if (sendMulticastNotificationRsp && sendMulticastNotificationRsp.successCount === registrationTokens.length) {
      return oThis._successResponseHandler(sendMulticastNotificationRsp);
    }

    return oThis._errorResponseHandler(sendMulticastNotificationRsp);
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
        debug_options: { error: JSON.stringify(error) }
      });
    }

    // await createErrorLogsEntry.perform(errorObj, errorLogsConstants.mediumSeverity);

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
    logger.info('_successResponseHandler----------------', successData);

    return responseHelper.successWithData(successData);
  }
}

module.exports = new FirebaseAdminSDK();
