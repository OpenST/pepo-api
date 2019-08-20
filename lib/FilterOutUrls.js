/**
 * This module helps in filtering out urls from text and store them.
 *
 * @module lib/FilterOutUrls
 */

const rootPrefix = '..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * @class FilterOutUrls
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
  }

  /**
   * Perform operation.
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    oThis._filterUrls();

    if (oThis.urls && oThis.urls.length > 0) {
      await oThis._addUrls();
    }

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      urls: oThis.urls,
      urlIds: oThis.urlIds
    });
  }

  /**
   * Filter urls from text.
   *
   * @private
   */
  _filterUrls() {
    const oThis = this;

    oThis.urls = oThis.textToFilter.match(
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)*/gi
    );
  }

  /**
   * Add urls in db.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUrls() {
    const oThis = this;

    let insertArray = [];

    for (let i = 0; i < oThis.urls.length; i++) {
      let url = oThis.urls[i];
      insertArray.push([url, urlConstants.invertedKinds[urlConstants.socialUrlKind]]);
    }

    if (insertArray.length > 0) {
      await new UrlModel().insertUrls(insertArray);

      // Fetch new inserted urls.
      const newUrls = await new UrlModel().getUrls(oThis.urls);

      for (let i = 0; i < newUrls.length; i++) {
        oThis.urlIds.push(newUrls[i].id);
      }
    }
  }
}

module.exports = FilterOutUrls;
