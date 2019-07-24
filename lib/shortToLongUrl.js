const rootPrefix = '..',
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

class ShortToLongUrl {
  /**
   * From short url, try to get full url
   *
   * @param url
   * @returns {*}
   */
  getFullUrl(url) {
    const oThis = this;

    let fullUrl = null;
    if (url.match(imageConstants.twitterImageUrlPrefix[1])) {
      fullUrl = url.replace(imageConstants.twitterImageUrlPrefix[1], imageConstants.twitterImageUrlPrefix[0]);
    } else {
      fullUrl = s3Constants.shortToLongUrlForResponse(url);
    }

    return fullUrl;
  }
}

module.exports = new ShortToLongUrl();
