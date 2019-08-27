const fireBaseAdmin = require('firebase-admin');

const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class Admin {
  constructor(params) {
    const oThis = this;
  }

  /**
   * Initialize Object.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initializeFireBaseObj() {
    const oThis = this;

    // move to some other location.
    const firebaseConfig = {
      type: 'service_account',
      project_id: 'myapp2-3e902',
      private_key_id: 'd6974f09fad92f893f789d59c13bd69860c45433',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9ARGJeEbRIE7g\nZPu05dnuFvuzsoIIEyFGXgdK53DxSDomAZFLQFw7tP9zjkBeXepfineYEy31Zbag\nVBn2RWt6r0GRQyYhMgLzbHa15GKahgedlw47RiXHSZbcGhK53XCfvSkRcqeYfpB2\nHvOEiRItRKNKlxQO4Jm6pUl8pHHJlrnlIm3yx2VCtkXjhCIDenjy2Fj3r3peTC5A\nY4wPb41Kv6UGyuZlRddl5lIwpraL0lkyZV9g0xMX7nJ9au4IpzFZqg9DPPsvJ3bB\nr9lJnlYmWbrw6P9DricpvByyc3IQIq6CT9D5QPqH4R5CsDQK07smVw67sdBAReZ9\ngKuHgGcFAgMBAAECggEAAJu/tk192k5R/3qY24t+WNB+cfbWLW//IHbHvcoQc+Mt\nytGv6aTmMVjFAb0Er4ujcmE0ciXp0SjOQj/xIpKHHSltBSpx7dsvmK+PVcj0lCPg\n3mW3HzZdEtkm1Xx2uD9nl7l7b3sFzVOfc0MrNBCnczRp6sneq2EcQ/jSeZNbsmjm\nNvdt8K2OCb4tjRmf+43GuWKaR0BIATCHBjTy9dlVt4kJWLXdfFbzooRZNx/aay2I\nkNRcgCHZqXM8NS9/qHGxGGoImjbMxWg43FuODy7o7eQ0JONfA/QBjIAxwsC145l2\nt+s909p9imF6shuc0gD2olhuvBq+f3fpmFe8w9p+wQKBgQDzN74Pci5L8H1XdfZ0\nRGW1VTTYhYVSsldPospSHb3OZuccQqvyFrg8HBiS1DX6ntgRbqBTBkUHxyq6ac+c\nBO5iljjG4n7ZjHwuPWeJyag5Mjcs93RGkJ1cC6nPRbPb+qKwJ8Zb1oEaF+3yvrcH\nG6X/HpjrAi18kOJ1kQAJOkmNSQKBgQDG7+9z06G+bssFDMss8nASAZMEpvoIX+Ex\nsuQ2QembqXXNOS9qArAyssR2H3CDDDLNAN99iFbcf4lNv7KRFsMTE4XLhhEzica5\nGwdX7HxV10lX712KDBxFTwUrqBMrgJaEyDBawqSOUX3BhQ4u9AD7rgIk0gfqe9OK\nPkb7uTD33QKBgQC3ns/ozWVSg7+9dhuY78JxwmBhT3y2UFpGjzp8AGQ6HcpBtbwm\nyyxQhU2wHHKcQawSjRiRVdxr4NvLXPMWcUqgN5Wp4XmvOLbQGh+/EPXmKJkrY67v\nT2LeCRgsmg0N+Q02PPEuiKVzU7mbWIzJ2v/ZufntAvngX2n5JH2Iee7psQKBgBXp\nyhOVJUTnyV82CI9b6TJikAI8LmCLxy+FSBQd8JCf+wTvHqTrxOLgxDlKv0cAKfxg\n8z1Nrlu9hK9WxWGsAzLvvJYtn2lw7L3pF0b9GrkN7NtN15zkNpz/1k73xZzOHkZk\nEsd8l0nB+js939EWOaF/imbp58tRdnzM3V7PCHDVAoGAC2XsQsrAIEXGLpK7SBA/\nvzg5Wg504VrIMlCI39atvLIT+xoRBgnNckGLprLioog6br1TvyqaPiOIaOQLk27Q\nKZfPf2fZEPSVDKQigMbJc4F8AktfBYj92zGP9+rMLsPrbsRDy6U4b/YY4DsY6iU4\nKw6Xv1uKkMIp+Gv1HJI3xLI=\n-----END PRIVATE KEY-----\n',
      client_email: 'firebase-adminsdk-bwx1p@myapp2-3e902.iam.gserviceaccount.com',
      client_id: '115189143830034112528',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-bwx1p%40myapp2-3e902.iam.gserviceaccount.com'
    };

    fireBaseAdmin.initializeApp({
      credential: fireBaseAdmin.credential.cert(config),
      databaseURL: 'https://myapp2-3e902.firebaseio.com' // move to some other location.
    });

    fireBaseAdmin.initializeApp(firebaseConfig);
  }

  /**
   * Sends the given message via FCM.
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send
   *
   * @param registrationToken
   * @param message
   * @returns {Promise<*>}
   */
  async sendNotification(registrationToken, message) {
    const oThis = this;

    await oThis._initializeSDKObj();

    let params = {
      data: message,
      token: registrationToken
    };

    let sendNotificationRsp = fireBaseAdmin
      .messaging()
      .send(params)
      .catch(function(err) {
        return oThis._errorResponseHandler(err);
      });

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

    await oThis._initializeSDKObj();

    let params = {
      data: messages,
      token: registrationToken
    };

    let sendAllNotificationRsp = fireBaseAdmin
      .messaging()
      .sendAll(params)
      .catch(function(err) {
        return oThis._errorResponseHandler(err);
      });

    if (sendAllNotificationRsp && sendAllNotificationRsp.success) {
      return oThis._successResponseHandler(sendAllNotificationRsp.data);
    }

    return oThis._errorResponseHandler(sendAllNotificationRsp);
  }

  /**
   * Sends the given multicast message to all the FCM registration tokens specified in it.
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-multicast
   *
   * @param registrationTokens
   * @param message
   * @returns {Promise<*>}
   */
  async sendMulticastNotification(registrationTokens, message) {
    const oThis = this;

    await oThis._initializeSDKObj();

    let params = {
      data: message,
      tokens: registrationTokens
    };

    let sendMulticastNotificationRsp = fireBaseAdmin
      .messaging()
      .sendMulticast(params)
      .catch(function(err) {
        return oThis._errorResponseHandler(err);
      });

    if (sendMulticastNotificationRsp && sendMulticastNotificationRsp.success) {
      return oThis._successResponseHandler(sendMulticastNotificationRsp.data);
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
    logger.error(error);

    let errorObj = null;

    if (responseHelper.isCustomResult(error)) {
      errorObj = error;
    } else {
      errorObj = responseHelper.error({
        internal_error_identifier: 'l_pn_f_a_1',
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
    logger.info(successData);

    return responseHelper.successWithData(successData);
  }
}

module.exports = new Admin();
