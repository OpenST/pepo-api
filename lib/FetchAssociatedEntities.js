/**
 * This module helps in fetching associated entities with user or videos.
 *
 * @module lib/FetchAssociatedEntities.js
 */
const rootPrefix = '..',
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class FetchAssociatedEntities {
  constructor(params) {
    const oThis = this;

    oThis.linkIds = params.linkIds || [];
    oThis.tagIds = params.tagIds || [];
    oThis.textIds = params.textIds || [];

    oThis.textData = {};
    oThis.includesData = {};
    oThis.tags = {};
    oThis.links = {};
    oThis.textMap = {};
  }

  /**
   * Main performer of class
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchTagAndLinksFromText();

    await oThis._fetchTags();

    await oThis._fetchLinks();

    return oThis._formatResponse();
  }

  /**
   * Fetch tag and links from texts
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTagAndLinksFromText() {
    const oThis = this;

    if (oThis.textIds.length > 0) {
      const cacheRsp = await new TextsByIdCache({ ids: oThis.textIds }).fetch();
      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      oThis.textData = cacheRsp.data;

      const includesCacheRsp = await new TextIncludesByIdsCache({ ids: oThis.textIds }).fetch();
      if (includesCacheRsp.isFailure()) {
        return Promise.reject(includesCacheRsp);
      }

      oThis.includesData = includesCacheRsp.data;
    }

    const allTagIds = [],
      allLinkIds = [];
    for (const textId in oThis.includesData) {
      const textIncludes = oThis.includesData[textId];

      for (let ind = 0; ind < textIncludes.length; ind++) {
        const include = textIncludes[ind],
          entity = include.entityIdentifier.split('_');

        if (entity[0] == textIncludeConstants.tagEntityKindShort) {
          allTagIds.push(+entity[1]);
        } else if (
          entity[0] == textIncludeConstants.linkEntityKindShort &&
          oThis.textData[textId].kind === textConstants.videoDescriptionKind
        ) {
          allLinkIds.push(+entity[1]); // Inserting only video description links, bio links are ignored
        }
      }
    }

    oThis.linkIds = [...new Set(oThis.linkIds.concat(allLinkIds))];
    oThis.tagIds = [...new Set(oThis.tagIds.concat(allTagIds))];
  }

  /**
   * Fetch tags if present
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTags() {
    const oThis = this;

    if (oThis.tagIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new TagByIdCache({ ids: oThis.tagIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.tags = cacheRsp.data;
  }

  /**
   * Fetch link
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchLinks() {
    const oThis = this;

    if (oThis.linkIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new UrlByIdCache({ ids: oThis.linkIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.links = cacheRsp.data;
  }

  /**
   * Format response to be returned.
   *
   * @returns {*|result}
   * @private
   */
  _formatResponse() {
    const oThis = this;

    oThis._formatTextResponse();

    let response = {
      tags: oThis.tags,
      links: oThis.links,
      textMap: oThis.textMap
    };
    return responseHelper.successWithData(response);
  }

  /**
   * Format text response to be sent.
   * @private
   */
  _formatTextResponse() {
    const oThis = this;

    for (const textId in oThis.textData) {
      const textIncludes = oThis.includesData[textId],
        tagIds = [],
        linkIds = [];

      // Fetch link id and tag ids
      for (let ind = 0; ind < textIncludes.length; ind++) {
        const includeRow = textIncludes[ind],
          entity = includeRow.entityIdentifier.split('_');

        if (entity[0] == textIncludeConstants.tagEntityKindShort) {
          tagIds.push(+entity[1]);
        } else if (entity[0] == textIncludeConstants.linkEntityKindShort) {
          linkIds.push(+entity[1]);
        }
      }

      oThis.textMap[textId] = oThis._formatLinkAndTagsInText(textId, tagIds, linkIds);
    }
  }

  /**
   * Format links and tags present in text
   *
   * @param textId
   * @param tagIds
   * @param linkIds
   * @returns {{includes: {}, text: *}}
   * @private
   */
  _formatLinkAndTagsInText(textId, tagIds, linkIds) {
    const oThis = this;

    const textData = {
      text: oThis.textData[textId].text,
      includes: {}
    };

    if (tagIds) {
      for (let ind = 0; ind < tagIds.length; ind++) {
        let tagId = tagIds[ind],
          tagDetail = oThis.tags[tagId],
          tagName = '#' + tagDetail.name;

        textData.includes[tagName] = {
          kind: 'tags',
          id: tagDetail.id
        };
      }
    }

    if (linkIds) {
      for (let ind = 0; ind < linkIds.length; ind++) {
        const linkId = linkIds[ind];

        textData.includes[oThis.links[linkId].url] = {
          kind: 'links',
          id: linkId
        };
      }
    }

    return textData;
  }
}

module.exports = FetchAssociatedEntities;
