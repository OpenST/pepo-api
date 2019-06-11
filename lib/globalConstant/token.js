'use strict';
/**
 * Global constants for tokens.
 *
 * @module lib/globalConstant/token
 */

const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for token.
 *
 * @class
 */
class Token {
  /**
   * Constructor for webhooks.
   *
   * @constructor
   */
  constructor() {}

  get airdropAmount() {
    return '10000000000000000000';
  }
}

module.exports = new Token();
