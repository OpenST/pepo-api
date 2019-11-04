const rootPrefix = '..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to filter out urls from text and save them.
 *
 * @class FilterOutUrls
 */
class FilterOutUrls {
  /**
   * Constructor to filter out urls from text and save them.
   *
   * @param {object} params
   * @param {string} params.text
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.textToFilter = params.text || '';

    oThis.urls = [];
    oThis.urlIds = [];
  }

  /**
   * Main performer for class.
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
   * @sets oThis.urls
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

    const insertArray = [];

    for (let index = 0; index < oThis.urls.length; index++) {
      const url = oThis.urls[index];
      insertArray.push([url, urlConstants.invertedKinds[urlConstants.socialUrlKind]]);
    }

    if (insertArray.length > 0) {
      await new UrlModel().insertUrls(insertArray);

      // Fetch new inserted urls.
      const newUrls = await new UrlModel().getUrls(oThis.urls);

      for (let index = 0; index < newUrls.length; index++) {
        oThis.urlIds.push(newUrls[index].id);
      }
    }
  }
}

module.exports = FilterOutUrls;
