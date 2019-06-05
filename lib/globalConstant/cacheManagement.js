/**
 * Cache management constants.
 *
 * @module lib/globalConstant/cacheManagement
 */

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for cache management constants.
 *
 * @class
 */
class CacheManagement {
  /**
   * Constructor for cache management constants.
   *
   * @constructor
   */
  constructor() {}

  get memcached() {
    return 'memcached';
  }

  get inMemory() {
    return 'in_memory';
  }

  get keyPrefix() {
    return `${coreConstants.environmentShort}_PA`;
  }
}

module.exports = new CacheManagement();
