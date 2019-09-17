/**
 * retry payment.
 *
 * Usage: node ./executables/oneTimers/getGooglePayVoidOrders.js
 *
 */
const Util = require('util'),
  GoogleAuthLibrary = require('google-auth-library');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  REQUEST_URL =
    'https://www.googleapis.com/androidpublisher/v3/applications/com.pepo.staging/purchases/voidedpurchases',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class GooglePayVoidOrders {
  /**
   * Async performer.
   *
   * @returns {Promise<boolean>}
   */
  async perform() {
    let authClient = new GoogleAuthLibrary.JWT(
      coreConstants.GOOGLE_INAPP_SERVICE_ACCOUNT_EMAIL,
      null,
      unescape(coreConstants.GOOGLE_INAPP_SERVICE_ACCOUNT_KEY),
      ['https://www.googleapis.com/auth/androidpublisher']
    );

    let url = Util.format(REQUEST_URL);

    return authClient.request({ url });
  }
}

const getGooglePayVoidOrders = new GooglePayVoidOrders();

getGooglePayVoidOrders
  .perform()
  .then(function(data) {
    logger.log('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nError data: ', err);
    process.exit(1);
  });
