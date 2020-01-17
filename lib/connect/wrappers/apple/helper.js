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
   * @returns {Promise<void>}
   */
  createClientSecret() {
    const oThis = this;

    let clientId = coreConstants.PA_APPLE_CLIENT_ID,
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
    return JwtAuth.verifyToken(identityToken, publicKey, { algorithms: 'RS256' });
  }
}
module.exports = new AppleHelper();
