const rootPrefix = '..',
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

/**
 * Class to convert short to long url.
 *
 * @class ShortToLongUrl
 */
class ShortToLongUrl {
  /**
   * This gives long url of cloudfront.
   *
   * @param {string} urlTemplate
   * @param {string} [size]
   * @returns {*}
   */
  getFullUrl(urlTemplate, size) {
    const oThis = this;

    let fullUrl = null;

    if (urlTemplate.match(imageConstants.twitterImageUrlPrefix[1])) {
      fullUrl = urlTemplate.replace(imageConstants.twitterImageUrlPrefix[1], imageConstants.twitterImageUrlPrefix[0]);
    } else {
      fullUrl = s3Constants.shortToLongUrlForResponse(urlTemplate);
    }

    if (size) {
      fullUrl = oThis.replaceSizeInUrlTemplate(fullUrl, size);
    }

    return fullUrl;
  }

  /**
   * This gives long url of s3.
   *
   * @param {string} url
   * @param {string} [size]
   *
   * @returns {*}
   */
  getFullUrlInternal(url, size) {
    const oThis = this;
    let fullUrl = null;
    if (url.match(imageConstants.twitterImageUrlPrefix[1])) {
      fullUrl = url.replace(imageConstants.twitterImageUrlPrefix[1], imageConstants.twitterImageUrlPrefix[0]);
    } else {
      fullUrl = s3Constants.convertToLongUrl(url);
    }

    if (size) {
      fullUrl = oThis.replaceSizeInUrlTemplate(fullUrl, size);
    }

    return fullUrl;
  }

  /**
   * Replace size in url template.
   *
   * @param {string} urlTemplate
   * @param {string} size
   *
   * @returns {string}
   */
  replaceSizeInUrlTemplate(urlTemplate, size) {
    return urlTemplate.replace(s3Constants.fileNameShortSizeSuffix, size);
  }

  /**
   * Get complete file name from url template.
   *
   * @param {string} urlTemplate
   * @param {string} size
   *
   * @returns {string}
   */
  getCompleteFileName(urlTemplate, size) {
    const oThis = this;

    const completeUrl = oThis.replaceSizeInUrlTemplate(urlTemplate, size),
      splitArray = completeUrl.split('/');

    return splitArray.pop();
  }
}

module.exports = new ShortToLongUrl();
