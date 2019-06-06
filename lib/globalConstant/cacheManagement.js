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

  // 10 minutes
  get smallExpiryTimeInterval() {
    return 600;
  }

  // 60 minutes
  get mediumExpiryTimeInterval() {
    return 3600;
  }

  // 1 day
  get largeExpiryTimeInterval() {
    return 86400;
  }
}

module.exports = new CacheManagement();
