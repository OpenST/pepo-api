/**
 * One timer to populate data for Gif Categories
 *
 * Usage: node executables/oneTimers/populateGifCategories.js
 *
 * @module executables/oneTimers/populateGifCategories
 */
const program = require('commander');

const rootPrefix = '../..',
  GifCategoryModel = require(rootPrefix + '/app/models/mysql/GifCategory'),
  GifsCacheKlass = require(rootPrefix + '/lib/cacheManagement/single/GifsByKeyword'),
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

    // Fetch Random gif for categories
    for (let i = 0; i < KNOWN_CATEGORIES.length; i++) {
      const categoryName = KNOWN_CATEGORIES[i];

      const gifObj = await oThis._fetchRandomGifForCategory(categoryName);

      if (null != gifObj) {
        await oThis._insertGifCategory(categoryName, gifObj);
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
    let resp = await new GifsCacheKlass({
      query: categoryName,
      pageNumber: Math.floor(Math.random() * 10 + 1)
    }).fetch();

    if (resp.isSuccess() && null != resp.data.gifs) {
      return resp.data.gifs[Math.floor(Math.random() * 10 + 1)];
    }

    return null;
  }

  /**
   * Insert category and one random gif
   *
   * @param categoryName
   * @param gifObj
   * @returns {Promise<void>}
   * @private
   */
  async _insertGifCategory(categoryName, gifObj) {
    const oThis = this;

    await new GifCategoryModel()
      .insert({
        name: categoryName,
        gif_id: gifObj.id,
        gif_data: JSON.stringify(gifObj)
      })
      .fire();
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
