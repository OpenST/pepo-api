'use strict';

/**
 * JWT Auth
 *
 * @module lib/jwt/jwtAuth
 */
const jwt = require('jsonwebtoken');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

class JwtAuth {
  /**
   * @constructor
   */
  constructor() {}

  // Issue new token
  static issueToken(data, key, jwtOptions) {
    return jwt.sign(data, key, jwtOptions);
  }

  /**
   * Verify token
   *
   * @param token {string} - jwt token
   * @param keyType {string} - key type
   *
   * @return {Promise<any>}
   */

  /**
   *
   * @param {string} token
   * @param {string} key
   * @param {object} jwtOptions
   * @returns {Promise<unknown>}
   */
  static verifyToken(token, key, jwtOptions) {
    return new Promise(function(onResolve, onReject) {
      let jwtCB = function(err, decodedToken) {
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
