/**
 * This module helps in filtering out tags from text and store them.
 *
 * @module lib/FilterOutTags
 */

const rootPrefix = '..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * @class
 *
 * Class to filter out tags from text
 */
class FilterOutTags {
  /**
   * @constructor
   *
   * Constructor of class to filter out text
   *
   * @param text
   * @param textId
   */
  constructor(text, textId) {
    const oThis = this;
    oThis.textToFilter = text || '';
    oThis.textId = textId;
    oThis.tags = [];
    oThis.tagIds = [];
    oThis.tagNames = {};
    oThis.tagIdToTagNameMap = {};
  }

  /**
   * Perform operation
   *
   */
  async perform() {
    const oThis = this;

    oThis._filterTags();

    if (oThis.tags && oThis.tags.length > 0) {
      await oThis._addUpdateTags();
      await oThis._insertInTextIncludes();
    }

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      tags: oThis.tags,
      tagIds: oThis.tagIds,
      tagIdToTagNameMap: oThis.tagIdToTagNameMap
    });
  }

  /**
   * Filter tags from text
   *
   * @private
   */
  _filterTags() {
    const oThis = this;

    oThis.tags = oThis.textToFilter.match(/#\w+/g);

    if (oThis.tags) {
      for (let ind = 0; ind < oThis.tags.length; ind++) {
        const tagName = oThis.tags[ind].substring(1).toLowerCase();
        oThis.tagNames[tagName] = 1;
      }
    }
  }

  /**
   * Add or update tags in db
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUpdateTags() {
    const oThis = this;

    const dbResp = await new TagModel().getTags(Object.keys(oThis.tagNames));

    for (let ind = 0; ind < dbResp.length; ind++) {
      const row = dbResp[ind];
      if (oThis.tagNames.hasOwnProperty(row.name.toLowerCase())) {
        oThis.tagIds.push(row.id);
        oThis.tagIdToTagNameMap[row.id] = row.name.toLowerCase();
        oThis.tagNames[row.name.toLowerCase()] = 0;
      }
    }

    // // Increase weight of known tags
    // if (oThis.tagIds.length > 0) {
    //   await new TagModel().updateTagWeights(oThis.tagIds);
    // }

    // There are more tags here, add them.
    if (CommonValidator.validateObject(oThis.tagNames)) {
      const insertArray = [],
        newTagNames = [];
      for (const tagName in oThis.tagNames) {
        if (oThis.tagNames[tagName]) {
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
        }
      }
    }
  }

  /**
   * Insert text includes
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTextIncludes() {
    const oThis = this;

    const entityIdentifiersArray = [];

    for (let ind = 0; ind < oThis.tagIds.length; ind++) {
      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.tagEntityKind],
          oThis.tagIds[ind]
        )
      );
    }

    await new TextIncludeModel().insertInTextIncludes(oThis.textId, entityIdentifiersArray, oThis.textToFilter);

    await TextIncludeModel.flushCache({ textIds: [oThis.textId] });
  }
}

module.exports = FilterOutTags;
