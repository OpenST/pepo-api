const jwt = require('jsonwebtoken');

const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for JWT auth.
 *
 * @class JwtAuth
 */
class JwtAuth {
  /**
   * Issue new token.
   *
   * @param {object} data
   * @param {string} keyType
   *
   * @returns {*}
   */
  static issueToken(data, keyType) {
    const oThis = this;

    const payload = { data: data },
      jwtOptions = { expiresIn: 60 * 5 };

    return jwt.sign(payload, oThis.getKeyFor(keyType), jwtOptions);
  }

  /**
   * Verify token.
   *
   * @param {string} token: jwt token
   * @param {string} keyType: key type
   *
   * @return {Promise<any>}
   */
  static verifyToken(token, keyType) {
    const oThis = this;

    return new Promise(function(onResolve, onReject) {
      const jwtCB = function(err, decodedToken) {
        if (err) {
          onReject(err);
        } else {
          onResolve(decodedToken);
        }
      };

      jwt.verify(token, oThis.getKeyFor(keyType), {}, jwtCB);
    });
  }

  /**
   * Get key for key type.
   *
   * @param {string} keyType: key type
   *
   * @return {string}
   */
  static getKeyFor(keyType) {
    return keyType === 'pepoApi' ? coreConstants.PR_INTERNAL_API_SECRET_KEY : '';
  }
}

module.exports = JwtAuth;
