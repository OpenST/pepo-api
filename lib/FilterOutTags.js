const rootPrefix = '..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude');

/**
 * Class to filter out tags from text.
 *
 * @class FilterOutTags
 */
class FilterOutTags {
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

    oThis.tags = [];
    oThis.tagIds = [];
    oThis.tagNames = {};
    oThis.tagsFromText = [];
    oThis.dbTags = [];
    oThis.lowerCaseTagNames = [];
    oThis.tagIdToTagNamesMap = {};
    oThis.lowercaseTagNamesToActualTextsMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<result>}
   */
  async perform() {
    const oThis = this;

    oThis._filterTags();

    await oThis._deleteEarlierTags();

    if (oThis.tags && oThis.tags.length > 0) {
      await oThis._addUpdateTags();
      await oThis._insertInTextIncludes();
    }

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      tags: oThis.tags,
      tagIds: oThis.tagIds,
      tagIdToTagNamesMap: oThis.tagIdToTagNamesMap
    });
  }

  /**
   * Filter tags from text.
   *
   * @sets oThis.tags
   *
   * @private
   */
  _filterTags() {
    const oThis = this;

    const tags = oThis.textToFilter.match(/(^|\s)#\w+/g);

    if (tags) {
      for (let ind = 0; ind < tags.length; ind++) {
        const tagName = tags[ind].trim().substring(1);

        if (tagName.length > tagConstants.maxTagLength) {
          continue;
        }

        oThis.tags.push(tagName);

        oThis.tagNames[tagName] = 1;
        oThis.lowerCaseTagNames.push(tagName.toLowerCase());
        oThis.tagsFromText.push(tagName);

        oThis.lowercaseTagNamesToActualTextsMap[tagName.toLowerCase()] =
          oThis.lowercaseTagNamesToActualTextsMap[tagName.toLowerCase()] || [];
        oThis.lowercaseTagNamesToActualTextsMap[tagName.toLowerCase()].push(tagName);
      }
    }
  }

  /**
   * Add or update tags in db.
   *
   * @sets oThis.tagIds, oThis.tagIdToTagNamesMap, oThis.tagNames
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUpdateTags() {
    const oThis = this,
      dbTagsMap = {};

    const dbResp = await new TagModel().getTags(oThis.tagsFromText);

    for (let i = 0; i < dbResp.length; i++) {
      dbTagsMap[dbResp[i].name] = dbResp[i];
      oThis.dbTags.push(dbResp[i].name);
    }

    for (let dbTag in dbTagsMap) {
      const dbRow = dbTagsMap[dbTag];

      if (oThis.lowercaseTagNamesToActualTextsMap[dbTag.toLowerCase()]) {
        let actualTagsArray = oThis.lowercaseTagNamesToActualTextsMap[dbTag.toLowerCase()];
        for (let i = 0; i < actualTagsArray.length; i++) {
          let tagName = actualTagsArray[i];
          oThis.tagNames[tagName] = 0;
          oThis.tagIdToTagNamesMap[dbRow.id] = oThis.tagIdToTagNamesMap[dbRow.id] || [];
          oThis.tagIdToTagNamesMap[dbRow.id].push(tagName);
        }
        oThis.tagIds.push(dbRow.id);
      }

      // if (tagIndex > -1) {
      //   let tagName = oThis.tagsFromText[tagIndex];
      //
      //   oThis.tagNames[tagName] = 0;
      //   oThis.tagIdToTagNamesMap[dbRow.id] = tagName;
      //   oThis.tagIds.push(dbRow.id);
      // }
    }

    // Increase weight of known tags.
    /* Commented code.
      if (oThis.tagIds.length > 0) {
        await new TagModel().updateTagWeights(oThis.tagIds);
      }
     */
    // There are more tags here, add them.
    if (CommonValidators.validateObject(oThis.tagNames)) {
      const insertArray = [],
        newTagNames = [],
        lowerCaseTagsMap = {};
      for (const tagName in oThis.tagNames) {
        if (oThis.tagNames[tagName] && !lowerCaseTagsMap[tagName.toLowerCase()]) {
          lowerCaseTagsMap[tagName.toLowerCase()] = 1;
          insertArray.push([tagName, 0, tagConstants.invertedStatuses[tagConstants.activeStatus]]);
          newTagNames.push(tagName);
        }
      }
      if (insertArray.length > 0) {
        await new TagModel().insertTags(insertArray);

        // Fetch new inserted tags
        const newTags = await new TagModel().getTags(newTagNames);

        for (let ind = 0; ind < newTags.length; ind++) {
          oThis.tagIds.push(newTags[ind].id);
          let actualTagsArray = oThis.lowercaseTagNamesToActualTextsMap[newTags[ind].name.toLowerCase()];
          for (let i = 0; i < actualTagsArray.length; i++) {
            let tagName = actualTagsArray[i];
            oThis.tagIdToTagNamesMap[newTags[ind].id] = oThis.tagIdToTagNamesMap[newTags[ind].id] || [];
            oThis.tagIdToTagNamesMap[newTags[ind].id].push(tagName);
          }
        }
      }
    }
  }

  /**
   * Delete earlier tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteEarlierTags() {
    const oThis = this;

    if (!oThis.textId) {
      return;
    }

    const oldTagIds = [];
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
        if (entity[0] == textIncludeConstants.tagEntityKindShort) {
          oldTagIds.push(+entity[1]);
        }
      }
    }

    const entityIdentifiersArray = [];

    if (oldTagIds.length === 0) {
      return;
    }

    for (let ind = 0; ind < oldTagIds.length; ind++) {
      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.tagEntityKind],
          oldTagIds[ind]
        )
      );
    }

    await new TextIncludeModel().deleteRowsForTextId(oThis.textId, entityIdentifiersArray);
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

    for (let ind = 0; ind < oThis.tagIds.length; ind++) {
      let actualTextsArray = oThis.tagIdToTagNamesMap[oThis.tagIds[ind]];

      for (let i = 0; i < actualTextsArray.length; i++) {
        let tagIdIdentifier = oThis.tagIds[ind];
        if(i > 0){
          tagIdIdentifier = oThis.tagIds[ind] + '_' + i
        }
        entityIdentifiersArray.push(
          textIncludeConstants.createEntityIdentifier(
            textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.tagEntityKind],
            tagIdIdentifier
          ) //i is specifically added which is sequence in actualTextsArray. This is to handle the case when same text with different cases are added.
          // For example: #CAP , #cap. Entity identifier for them will be. t_100_0, t_100_1. 100 being tag id.
        );
        const tagNameWithTagPrefix = '#' + actualTextsArray[i];
        replaceableTextsArray.push(tagNameWithTagPrefix);
      }
    }

    console.log('----replaceableTextsArray----', replaceableTextsArray);

    await new TextIncludeModel().insertInTextIncludes(oThis.textId, entityIdentifiersArray, replaceableTextsArray);
  }
}

module.exports = FilterOutTags;
