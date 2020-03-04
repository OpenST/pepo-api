/**
 * Apple helper function
 *
 * @module lib/connect/wrappers/apple/helper
 */

const rootPrefix = '../../../..',
  JwtAuth = require(rootPrefix + '/lib/jwt/jwtAuth'),
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
   * @param publicKey
   * @returns {Promise<void>}
   */
  async getDecryptedIdentityToken(identityToken, publicKey) {
    console.log('--identityToken---', identityToken);
    console.log('---publicKey---', publicKey);
    return JwtAuth.verifyToken(identityToken, publicKey, { algorithms: 'RS256' });
  }
}
module.exports = new AppleHelper();
