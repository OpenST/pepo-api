#!/usr/bin/env node

/*
 *
 * Utility to flush shared memcached
 *
 * Usage: node ./devops/exec/flushMemcache.js
 *
 */

const rootPrefix = '../..',
  cache = require(rootPrefix + '/lib/providers/memcached');

let cacheImplementer = cache.getInstance().cacheInstance;

cacheImplementer.delAll().then(function() {
  console.log('--------Flushed memcached--------');
  process.exit(0);
});
