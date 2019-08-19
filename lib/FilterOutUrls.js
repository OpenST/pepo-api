/**
 * This module helps in filtering out urls from text and store them.
 *
 * @module lib/FilterOutUrls
 */

const rootPrefix = '..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * @class
 *
 * Class to filter out urls from text
 */
class FilterOutUrls {
  /**
   * @constructor
   *
   * Constructor of class to filter out urls/links.
   *
   * @param text
   */
  constructor(text) {
    const oThis = this;
    oThis.textToFilter = text || '';

    oThis.urls = [];
    oThis.urlIds = [];
    oThis.urlMap = {};
  }

  /**
   * Perform operation
   *
   */
  async perform() {
    const oThis = this;

    oThis._filterUrls();

    if (oThis.urls && oThis.urls.length > 0) {
      await oThis._addUpdateUrls();
    }

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      urls: oThis.urls,
      urlIds: oThis.urlIds
    });
  }

  /**
   * Filter tags from text
   *
   * @private
   */
  _filterUrls() {
    const oThis = this;

    oThis.urls = oThis.textToFilter.match(
      /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/g
    );
  }

  /**
   * Add or update tags in db
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUpdateUrls() {
    const oThis = this;

    const dbResp = await new UrlModel().getUrls(oThis.urls);

    for (let i = 0; i < dbResp.length; i++) {
      const row = dbResp[i];
      if (oThis.urlMap.hasOwnProperty(row.url)) {
        oThis.urlIds.push(row.id);
        oThis.urlMap[row.name] = 0;
      }
    }

    // There are more urls here, add them.
    if (CommonValidator.validateObject(oThis.urlMap)) {
      let insertArray = [],
        newUrlNames = [];
      for (let url in oThis.urlMap) {
        if (oThis.urlMap[url]) {
          insertArray.push([url, urlConstants.invertedKinds[urlConstants.socialUrlKind]]);
          newUrlNames.push(url);
        }
      }
      if (insertArray.length > 0) {
        await new UrlModel().insertTags(insertArray);

        // Fetch new inserted tags
        const newUrls = await new UrlModel().getUrls(newUrlNames);

        for (let i = 0; i < newUrls.length; i++) {
          oThis.urlIds.push(newUrls[i].id);
        }
      }
    }
  }
}

module.exports = FilterOutUrls;
