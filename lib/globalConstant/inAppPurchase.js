/**
 * Class for in app purchase constants.
 *
 * @class InAppPurchase
 */
class InAppPurchaseConstants {
  get googleAndroidPublisherScopeEndpoint() {
    return 'https://www.googleapis.com/auth/androidpublisher';
  }

  get googleInAppServiceAccountEmail() {
    return process.env.PA_GOOGLE_INAPP_SERVICE_ACCOUNT_EMAIL;
  }

  get googleInAppServiceAccountKey() {
    return process.env.PA_GOOGLE_INAPP_SERVICE_ACCOUNT_KEY;
  }

  get googleReceiptValidationRequestUrl() {
    return 'https://www.googleapis.com/androidpublisher/v3/applications/%s/purchases/products/%s/tokens/%s';
  }

  get appleProductionReceiptValidationEndpoint() {
    return 'https://buy.itunes.apple.com/verifyReceipt';
  }

  get appleSandboxReceiptValidationEndpoint() {
    return 'https://sandbox.itunes.apple.com/verifyReceipt';
  }
}

module.exports = new InAppPurchaseConstants();
