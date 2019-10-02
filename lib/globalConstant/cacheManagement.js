const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for cache management constants.
 *
 * @class CacheManagement
 */
class CacheManagement {
  get memcached() {
    return 'memcached';
  }

  get inMemory() {
    return 'in_memory';
  }

  get keyPrefix() {
    return `${coreConstants.environmentShort}_PA`;
  }

  // 1 minute
  get verySmallExpiryTimeInterval() {
    return 60;
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

  // 3 day
  get threeDayExpiryTimeInterval() {
    return 259200;
  }
}

module.exports = new CacheManagement();
