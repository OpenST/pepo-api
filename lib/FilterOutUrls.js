const rootPrefix = '..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  UrlsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
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
   * @param {array<number>} [params.existingLinkIds]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.textToFilter = params.text || '';
    oThis.existingLinkIds = params.existingLinkIds || [];

    oThis.toBeDeletedLinkIds = [];
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

    if (oThis.existingLinkIds.length > 0) {
      await oThis._fetchExistingUrls();
    }

    if (oThis.urls && oThis.urls.length > 0) {
      await oThis._addUrls();
    }

    if (oThis.toBeDeletedLinkIds.length > 0) {
      await oThis._deleteUrls();
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
   * Fetch existing urls.
   *
   * @sets oThis.urlIds, oThis.toBeDeletedLinkIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchExistingUrls() {
    const oThis = this;

    const cacheRsp = await new UrlsByIdsCache({ ids: oThis.existingLinkIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (let index = 0; index < oThis.existingLinkIds.length; index++) {
      const existingLinkId = oThis.existingLinkIds[index];
      const existingUrlEntity = cacheRsp.data[existingLinkId];

      const arrayIndex = oThis.urls.indexOf(existingUrlEntity.url);
      // If existing url exists in new urls, remove that url from the new urls array.
      if (arrayIndex > -1) {
        oThis.urls.splice(arrayIndex, 1);
        oThis.urlIds.push(existingLinkId);
      } else {
        // If existing url does not exist in new urls, delete that url from the table.
        oThis.toBeDeletedLinkIds.push(existingLinkId);
      }
    }
  }

  /**
   * Add urls in db.
   *
   * @sets oThis.urlIds
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

  /**
   * Delete urls from table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteUrls() {
    const oThis = this;

    await new UrlModel()
      .delete()
      .where({ id: oThis.toBeDeletedLinkIds })
      .fire();

    await UrlModel.flushCache({ ids: oThis.toBeDeletedLinkIds });
  }
}

module.exports = FilterOutUrls;
