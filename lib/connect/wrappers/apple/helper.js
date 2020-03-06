/**
 * Apple helper function
 *
 * @module lib/connect/wrappers/apple/helper
 */

const rootPrefix = '../../../..',
  JwtAuth = require(rootPrefix + '/lib/jwt/jwtAuth'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const APPLE_API_URL = 'https://appleid.apple.com';

class AppleHelper {
  constructor() {}

  /**
   * Create client secret
   *
   * @param appleClientId
   * @returns {undefined|*}
   */
  createClientSecret(appleClientId) {
    const oThis = this;

    let clientId = appleClientId,
      teamId = coreConstants.PA_APPLE_TEAM_ID,
      keyIdentifier = coreConstants.PA_APPLE_KEY_IDENTIFIER,
      privateKey = unescape(coreConstants.PA_APPLE_PRIVATE_KEY);

    const timeNow = Math.floor(Date.now() / 1000);

    const claims = {
      iss: teamId,
      iat: timeNow,
      exp: timeNow + 15777000,
      aud: APPLE_API_URL,
      sub: clientId
    };

    const header = { alg: 'ES256', kid: keyIdentifier };

    return JwtAuth.issueToken(claims, privateKey, { algorithm: 'ES256', header });
  }

  /**
   * Get decrypted identity token
   *
   * @param identityToken
   * @param publicKeys
   * @returns {Promise<void>}
   */
  async getDecryptedIdentityToken(identityToken, publicKeys) {
    let decryptedResponse = {},
      tokenDecrypted = false;
    for (let index = 0; index < publicKeys.length; index++) {
      try {
        decryptedResponse = JwtAuth.verifyToken(identityToken, publicKeys[index], { algorithms: 'RS256' });
        tokenDecrypted = true;
        break;
      } catch (e) {}
    }
    if (!tokenDecrypted) {
      logger.error('1_c_w_a_h_1', 'Identity token decryption failed: ', identityToken, publicKeys);
    }
    return decryptedResponse;
  }
}
module.exports = new AppleHelper();
