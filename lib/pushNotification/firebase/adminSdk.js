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
      private_key_id: 'c993b9f9a18d8d22af704e7af1b78db570129bca',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCuc/2wYEUDiOL3\nrP9QrXZptXjqBy3TI4rq0E5Qe1+pOf81pYgDWC5ElnNfN/pl5SVZGyifI3ssBWGv\n8dCnu5DP7Qi7p7/bH2InbrdHlNrcL/ysx3efs6TfT11GltAoW8yEUxzZRpeHnfWQ\n2MEvbPPcejLT0U/ZEuBaqfjlQvFBNfFQCwO82l/3f4yi33gpRgUSOsyKr1ytUlpy\nHYQdK2YDPraRPd93p60m2R9j4+sh/cgAjdV5OjsMm5tV/K2zlFtOjZiF3yYDVJOy\nGlEgLkZWE2ehMP7upJkxJaWvEhkxRUKSfZ7LGBpgu03SiHOgyiuF8nCPj7/1jVIK\n3tw3Fv2FAgMBAAECggEADFfeokUdfPOJg5a09eNgFnilloFth5vjL1wPvngMO7AD\n06rjpcDufSHcBeezCtScwOJADIp5I5M55zYH2mZWB7Awxv5Gf92Hl1ypESKCHcQz\nb5Ipb55JUxeNdPokvkZIgTBUQTdSb2EIx/feK1ndI0NuJziPGr/QKfoOx0HmSgPF\n8zVaKaUfXO/5DEOKV3zCQ3B6pOPRvIpbhziKS17I2TcFBn1IGkevnmt2fgV52x+P\nmHJEbBsKE80I/+LY4vSux5obQCoCMCvitckMVXHPYKrsxiQOXR+bwzhl+B/+LYib\nait2NhgvGipQFEf8xGHQH9b8bR1RynWSZ/Djg0p/AQKBgQDtxOQZEfyZIrQJLyJg\nVUkLDfrhc8AfM1vilz+Nbigl62bQ4n02QABSkiVnjYGtZW86xGOJUYMDSGQaR0Mc\nnxoWvGDYqu8QXCK77GHOPPYlQXOHp/xhCJEN+xvVsYtN0kDjwzLjB9MLwtf2kaUR\nWJktskPoWDJglP2g4U0vCkB+wQKBgQC71Ek8UgVOJJt7tbwtIwpn7MzqS9qApRM6\nUjkjkqGhXq7A/xA9CKDKJo6tpwRWxJgeRC2P3/mRYMfiZM2CZ8939DsOdOYgr05k\nWbEbWFzoWv+GssT1SIORPPxUysrZa4+py28mVsOVTiUGZWCJvEMSYir03DrtjN+V\n6p2TjHUzxQKBgBmuxdCrb7R+2iGP1M/BBpXKGcpWfW8hVhCAs92sA2wtJDr16/57\nJU3F+YJY96PqK/yWEAZaJqOpIx7viaFC0keYa4Gb3RzQRvQzkVD8pr3Zdwg1Lf6x\nNTHkaNpJRjnOtzGi+REq3DIOBtPcYY8hGdKkyc8ED9T84vSIwZSOL+9BAoGAIehd\n3DTWXlf/daLGOMPFoiM+juForaafRP0I8aIL6azFEXQ6QzpmhHfXdAPdpahR6czX\nCM0fKZ52Fympa+w/qOD/NEnoLWhYV4dVkKEwDIY48OEe60TO84414zzEx+FCCx39\nj8dEAZUc2/27IsJIvW3ZYWDMhovS5SZ4keVeVx0CgYAmdrRzdTGK5DcKpRGBatoT\nEclIn4oEH+QT/hXMHk2cOFvprt9nGnUkhisYokx/ufsJbjXfDXn4uxQug8kStufJ\nqcIsYpPZp+4NMIVIcEoUI6zlvoP30ZSTRBNrbB6GpMjC36pg29T/u055bQ7Q5tAO\nTaL9oa8AoF2BLsk9SUkddQ==\n-----END PRIVATE KEY-----\n',
      client_email: 'firebase-adminsdk-fue40@pepo2-18368.iam.gserviceaccount.com',
      client_id: '105010870333743231979',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fue40%40pepo2-18368.iam.gserviceaccount.com'
    };

    fireBaseAdmin = fireBaseAdminSDK.initializeApp({
      credential: fireBaseAdminSDK.credential.cert(firebaseConfig),
      databaseURL: 'https://pepo2-18368.firebaseio.com' // move to some other location.
    });
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

    let multicastMessage = Object.assign(messageParams, { tokens: registrationTokens });

    console.log(
      '\nmulticastMessage ========',
      multicastMessage,
      '\n========= Size:',
      JSON.stringify(multicastMessage).length
    );

    let sendMulticastNotificationRsp = await fireBaseAdmin
      .messaging()
      .sendMulticast(multicastMessage)
      .catch(function(err) {
        console.log('err from admin sdk ====', err);
        return oThis._errorResponseHandler(err);
      });

    logger.log('\nsendMulticastNotificationRsp =========================', sendMulticastNotificationRsp);

    if (sendMulticastNotificationRsp && sendMulticastNotificationRsp.successCount === registrationTokens.length) {
      return oThis._successResponseHandler(sendMulticastNotificationRsp);
    }

    return oThis._errorResponseHandler(sendMulticastNotificationRsp);
  }

  /**
   * Sends the given message via FCM.
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send
   *
   * @param registrationToken
   * @param messageParams
   * @returns {Promise<*>}
   */
  async sendNotification(registrationToken, messageParams) {
    const oThis = this;

    if (!fireBaseAdmin) {
      await oThis._initializeFireBaseObj();
    }

    let message = Object.assign(messageParams, { tokens: registrationToken });

    console.log('\nmessage =========================', message, typeof message);

    let sendNotificationRsp = await fireBaseAdmin
      .messaging()
      .send(message)
      .catch(function(err) {
        logger.error('err from admin sdk =========================', err);
        return oThis._errorResponseHandler(err);
      });

    logger.log('\nsendNotificationRsp =========================', sendNotificationRsp);

    if (sendNotificationRsp) {
      return oThis._successResponseHandler(sendNotificationRsp);
    }

    return oThis._errorResponseHandler(sendNotificationRsp);
  }

  /**
   * Sends all the messages in the given array
   * https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#sendall
   *
   * @param registrationTokens
   * @param messages
   * @returns {Promise<*>}
   */
  async sendAllNotification(registrationTokens, messages) {
    const oThis = this;

    if (!fireBaseAdmin) {
      await oThis._initializeFireBaseObj();
    }

    let message = Object.assign(messages, { tokens: registrationTokens }),
      sendAllNotificationRsp = await fireBaseAdmin
        .messaging()
        .sendAll(message)
        .catch(function(err) {
          return oThis._errorResponseHandler(err);
        });

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
    return responseHelper.successWithData(successData);
  }
}

module.exports = new FirebaseAdminSDK();
