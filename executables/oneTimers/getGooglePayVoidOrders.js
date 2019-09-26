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
  inAppPurchaseConstants = require(rootPrefix + '/lib/globalConstant/inAppPurchase'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const REQUEST_URL = inAppPurchaseConstants.googleReceiptValidationRequestUrl;

class GooglePayVoidOrders {
  /**
   * Async performer.
   *
   * @returns {Promise<boolean>}
   */
  async perform() {
    let authClient = new GoogleAuthLibrary.JWT(
      inAppPurchaseConstants.googleInAppServiceAccountEmail,
      null,
      unescape(inAppPurchaseConstants.googleInAppServiceAccountKey),
      [inAppPurchaseConstants.googleAndroidPublisherScopeEndpoint]
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
