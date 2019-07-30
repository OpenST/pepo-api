const rootPrefix = '..',
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

class ShortToLongUrl {
  /**
   * This gives long url of cloudfront.
   *
   * @param url
   * @returns {*}
   */
  getFullUrl(url) {
    let fullUrl = null;
    if (url.match(imageConstants.twitterImageUrlPrefix[1])) {
      fullUrl = url.replace(imageConstants.twitterImageUrlPrefix[1], imageConstants.twitterImageUrlPrefix[0]);
    } else {
      fullUrl = s3Constants.shortToLongUrlForResponse(url);
    }

    return fullUrl;
  }

  /**
   * This gives long url of s3.
   *
   * @param url
   * @returns {*}
   */
  getFullUrlInternal(url) {
    let fullUrl = null;
    if (url.match(imageConstants.twitterImageUrlPrefix[1])) {
      fullUrl = url.replace(imageConstants.twitterImageUrlPrefix[1], imageConstants.twitterImageUrlPrefix[0]);
    } else {
      fullUrl = s3Constants.convertToLongUrl(url);
    }

    return fullUrl;
  }

  /**
   * Replace size in url template.
   *
   * @param {string} urlTemplate
   * @param {string} size
   */
  replaceSizeInUrlTemplate(urlTemplate, size) {
    return urlTemplate.replace('{{s}}', size);
  }

  /**
   * Get complete file name from url template.
   *
   * @param {string} urlTemplate
   * @param {string} size
   */
  getCompleteFileName(urlTemplate, size) {
    const oThis = this;

    const completeUrl = oThis.replaceSizeInUrlTemplate(urlTemplate, size),
      splitArray = completeUrl.split('/');

    return splitArray.pop();
  }
}

module.exports = new ShortToLongUrl();
