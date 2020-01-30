const rootPrefix = '..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude');

/**
 * Class to filter out links from text.
 *
 * @class FilterOutLinks
 */
class FilterOutLinks {
  /**
   * Constructor of class to filter out text.
   *
   * @param {string} [text]
   * @param {number} textId
   *
   * @constructor
   */
  constructor(text, textId) {
    const oThis = this;

    oThis.textToFilter = text || '';
    oThis.textId = textId;

    oThis.links = [];
    oThis.linkIds = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<result>}
   */
  async perform() {
    const oThis = this;

    oThis._filterLinks();

    await oThis._deleteEarlierLinks();

    if (oThis.links && oThis.links.length > 0) {
      await oThis._insertInUrls();
      await oThis._insertInTextIncludes();
    }

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      links: oThis.links,
      linkIds: oThis.linkIds
    });
  }

  /**
   * Filter tags from text.
   *
   * @sets oThis.links
   *
   * @private
   */
  _filterLinks() {
    const oThis = this;

    // (?: ) indicates that we don't consider ost.com and .com as different if ost.com is the string
    oThis.links = oThis.textToFilter.match(
      /((http|https):\/\/)?(www.)?([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/gi
    );
  }

  /**
   * Delete earlier links.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteEarlierLinks() {
    const oThis = this;

    if (!oThis.textId) {
      return;
    }

    const linkIds = [];
    const cacheRsp = await new TextIncludesByIdsCache({ ids: [oThis.textId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const textIncludes = cacheRsp.data;

    for (const textId in textIncludes) {
      const includes = textIncludes[textId];

      for (let ind = 0; ind < includes.length; ind++) {
        const include = includes[ind],
          entity = include.entityIdentifier.split('_');
        if (entity[0] === textIncludeConstants.linkEntityKindShort) {
          linkIds.push(+entity[1]);
        }
      }
    }

    const entityIdentifiersArray = [];

    if (linkIds.length === 0) {
      return;
    }

    for (let ind = 0; ind < linkIds.length; ind++) {
      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.linkEntityKind],
          linkIds[ind]
        )
      );
    }

    await new TextIncludeModel().deleteRowsForTextId(oThis.textId, entityIdentifiersArray);

    // Remove from url model
    await new UrlModel({}).deleteByIds({ ids: linkIds });
  }

  /**
   * Insert in urls
   *
   * @sets oThis.linkIds
   *
   * @returns {Promise}
   * @private
   */
  async _insertInUrls() {
    const oThis = this;

    for (let ind = 0; ind < oThis.links.length; ind++) {
      const link = oThis.links[ind];

      const response = await new UrlModel().insertUrl({
        url: link,
        kind: urlConstants.channelDescriptionUrlKind
      });

      oThis.linkIds.push(response.insertId);
    }
  }

  /**
   * Insert in text includes.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTextIncludes() {
    const oThis = this;

    const entityIdentifiersArray = [],
      replaceableTextsArray = [];

    for (let ind = 0; ind < oThis.linkIds.length; ind++) {
      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.linkEntityKind],
          oThis.linkIds[ind]
        )
      );

      replaceableTextsArray.push(oThis.links[ind]);
    }

    await new TextIncludeModel().insertInTextIncludes(oThis.textId, entityIdentifiersArray, replaceableTextsArray);
  }
}

module.exports = FilterOutLinks;
