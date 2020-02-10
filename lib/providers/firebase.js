const fireBaseAdminSDK = require('firebase-admin');

const rootPrefix = '../..',
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy');

/**
 * Class for firebase provider.
 *
 * @class Firebase
 */
class Firebase {
  /**
   * Get instance method of firebase.
   *
   * @returns {Promise<*>}
   */
  async getInstance() {
    const configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy');

    const firebaseConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.firebase);

    if (firebaseConfigResponse.isFailure()) {
      return firebaseConfigResponse;
    }

    const firebaseConfigStrategy = firebaseConfigResponse.data[configStrategyConstants.firebase];

    const firebaseConfig = {
      type: firebaseConfigStrategy.type,
      project_id: firebaseConfigStrategy.projectId,
      private_key_id: firebaseConfigStrategy.privateKeyId,
      private_key: firebaseConfigStrategy.privateKey,
      client_email: firebaseConfigStrategy.clientEmail,
      client_id: firebaseConfigStrategy.clientId,
      auth_uri: firebaseConfigStrategy.authUri,
      token_uri: firebaseConfigStrategy.tokenUri,
      auth_provider_x509_cert_url: firebaseConfigStrategy.authProviderx509CertUrl,
      client_x509_cert_url: firebaseConfigStrategy.clientx509CertUrl
    };

    return fireBaseAdminSDK.initializeApp({
      credential: fireBaseAdminSDK.credential.cert(firebaseConfig),
      databaseURL: firebaseConfigStrategy.databaseURL
    });
  }
}

module.exports = new Firebase();
