/**
 * One timer to populate data for Gif Categories
 *
 * Usage: node executables/oneTimers/populateGifCategories.js
 *
 * @module executables/oneTimers/populateGifCategories
 */
const program = require('commander'),
  querystring = require('querystring');

const rootPrefix = '../..',
  GifCategoryModel = require(rootPrefix + '/app/models/mysql/GifCategory'),
  GifsCacheByKeyword = require(rootPrefix + '/lib/cacheManagement/single/GifsByKeyword'),
  GifsTrendingCache = require(rootPrefix + '/lib/cacheManagement/single/GifsTrending'),
  gifCategoryConstant = require(rootPrefix + '/lib/globalConstant/gifCategory'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const KNOWN_CATEGORIES = [
  'love',
  'good night',
  'good morning',
  'kisses',
  'funny',
  'hey',
  'happy birthday',
  'flirt',
  'lol',
  'i love you',
  'hearts',
  'good',
  'hi',
  'hug',
  'sad',
  'happy',
  'miss you'
];

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/populateGifCategories.js');
  logger.log('');
  logger.log('');
});

/**
 * class to insert webhooks secret
 *
 * @class
 */
class PopulateGifCategories {
  /**
   * constructor to populate gif categories
   *
   * @constructor
   */
  constructor() {}

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    // Insert trending gif category
    const trendingGifObj = await oThis._fetchTrendingGif();
    await new GifCategoryModel()
      .insert({
        name: 'trending',
        gif_id: trendingGifObj.id,
        kind: gifCategoryConstant.invertedKinds[gifCategoryConstant.trendingKind],
        gif_data: JSON.stringify(trendingGifObj)
      })
      .fire();

    // Fetch Random gif for categories
    for (let i = 0; i < KNOWN_CATEGORIES.length; i++) {
      const categoryName = KNOWN_CATEGORIES[i];

      const gifObj = await oThis._fetchRandomGifForCategory(categoryName);

      if (null != gifObj) {
        await new GifCategoryModel()
          .insert({
            name: categoryName,
            gif_id: gifObj.id,
            kind: gifCategoryConstant.invertedKinds[gifCategoryConstant.searchKind],
            gif_data: JSON.stringify(gifObj)
          })
          .fire();
      }
    }
  }

  /**
   * Fetch random Gif for given category
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchRandomGifForCategory(categoryName) {
    const oThis = this;

    // Fetch set of random Gifs
    let resp = await new GifsCacheByKeyword({
      query: categoryName,
      pageNumber: 1
    }).fetch();

    if (resp.isSuccess() && resp.data.gifs.length > 0) {
      return resp.data.gifs[Math.floor(Math.random() * 10)];
    }

    return {};
  }

  /**
   * Fetch trending Gif
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTrendingGif() {
    const oThis = this;

    // Fetch set of random Gifs
    let resp = await new GifsTrendingCache({
      pageNumber: 1
    }).fetch();

    if (resp.isSuccess() && resp.data.gifs.length > 0) {
      return resp.data.gifs[Math.floor(Math.random() * 10)];
    }

    return {};
  }
}

new PopulateGifCategories()
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
