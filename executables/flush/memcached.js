/*
 *
 * Utility to flush shared memcached
 *
 * Usage: node ./executables/flush/memcached.js
 *
 */

const rootPrefix = '../..',
  cache = require(rootPrefix + '/lib/providers/memcached');

let cacheImplementer = cache.getInstance().cacheInstance;

cacheImplementer.delAll().then(function() {
  console.log('--------Flushed memcached--------');
  process.exit(0);
});
