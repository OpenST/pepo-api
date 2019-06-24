const querystring = require('querystring');

const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

class GifCategory {
  constructor() {}

  get trendingKind() {
    return 'trending';
  }

  get searchKind() {
    return 'search';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.trendingKind,
      '2': oThis.searchKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }

  /**
   * Get URL for kind and category name
   *
   * @param kind
   * @param categoryName
   * @return {string}
   */
  getUrlFor(kind, categoryName) {
    const oThis = this;

    if (kind === oThis.trendingKind) {
      return '/gifs/trending';
    } else {
      return '/gifs/search?' + querystring.stringify({ query: categoryName });
    }
  }
}

module.exports = new GifCategory();
