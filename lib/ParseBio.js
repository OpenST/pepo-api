const rootPrefix = '..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class ParseBio {
  /**
   * @constructor
   *
   * @param {object} params
   * @param {string} params.bio - bio
   */
  constructor(params) {
    const oThis = this;

    oThis.bio = params.bio.toLowerCase();

    oThis.tags = [];
    oThis.tagToWeightMap = {};
    oThis.updateMap = {};
    oThis.insertMap = {};

    oThis.caseStatement = '';
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._parseTags();

    await oThis._segregateTags();

    if (CommonValidator.validateNonEmptyObject(oThis.insertMap)) {
      await oThis._insertTags();
    }

    if (CommonValidator.validateNonEmptyObject(oThis.updateMap)) {
      await oThis._updateTags();
    }
  }

  /**
   * Parse tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _parseTags() {
    const oThis = this,
      regexExp = /(^|\B)#[a-z0-9]\w+/gi; // Update this regex.
    // /(\B(#[a-z0-9])\w+)/gi;

    oThis.tags = oThis.bio.match(regexExp);

    if (oThis.tags == null) {
      return;
    }

    for (let index = 0; index < oThis.tags.length; index++) {
      //  Remove the #, space and convert tag to lower case.
      const tag = (oThis.tags[index] = oThis.tags[index]
        .trim()
        .substring(1)
        .toLowerCase());

      oThis.tagToWeightMap[tag] = oThis.tagToWeightMap[tag] + 1 || 1;
    }

    oThis.insertMap = basicHelper.deepDup(oThis.tagToWeightMap);
  }

  /**
   * Segregate tags into the existing and new ones.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _segregateTags() {
    const oThis = this;

    if (oThis.tags == null) {
      return;
    }

    const dbRows = await new TagModel().getTags(oThis.tags);

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index],
        tagName = dbRow.name;

      oThis.updateMap[tagName] = oThis.tagToWeightMap[tagName] + parseInt(dbRow.weight);

      oThis.caseStatement = oThis._updateCaseStatement(tagName, oThis.tagToWeightMap[tagName]);

      delete oThis.insertMap[dbRow.name];
    }

    logger.log('oThis.updateMap ======', oThis.updateMap);
    logger.log('oThis.insertMap ======', oThis.insertMap);
  }

  /**
   * Insert new tags into tags table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertTags() {
    const oThis = this,
      insertArray = [];

    for (let tag in oThis.insertMap) {
      const singleTagRow = [];

      singleTagRow.push(tag);
      singleTagRow.push(oThis.insertMap[tag]);
      singleTagRow.push(tagConstants.invertedStatuses[tagConstants.activeStatus]);

      insertArray.push(singleTagRow);
    }

    await new TagModel().insertTags(insertArray);
  }

  /**
   * Update the tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTags() {
    const oThis = this;

    oThis.caseStatement = '`weight` = case ' + oThis.caseStatement + ' end';

    await new TagModel().updateTags(oThis.caseStatement, oThis.tags);
  }

  /**
   * Update the case statement.
   *
   * @param tag
   * @param weight
   *
   * @returns {string}
   * @private
   */
  _updateCaseStatement(tag, weight) {
    const oThis = this;
    return oThis.caseStatement + 'when name = ' + '"' + tag + '"' + ' then ' + weight + ' ';
  }
}

module.exports = ParseBio;
