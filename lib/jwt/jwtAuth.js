const jwt = require('jsonwebtoken');

/**
 * Class for JWT authentication.
 *
 * @class JwtAuth
 */
class JwtAuth {
  // Issue new token.
  static issueToken(data, key, jwtOptions) {
    return jwt.sign(data, key, jwtOptions);
  }

  /**
   * Verify token
   *
   * @param {string} token
   * @param {string} key
   * @param {object} jwtOptions
   *
   * @returns {Promise<unknown>}
   */
  static verifyToken(token, key, jwtOptions) {
    return new Promise(function(onResolve, onReject) {
      const jwtCB = function(err, decodedToken) {
        if (err) {
          onReject(err);
        } else {
          onResolve(decodedToken);
        }
      };

      jwt.verify(token, key, jwtOptions, jwtCB);
    });
  }
}

module.exports = JwtAuth;
