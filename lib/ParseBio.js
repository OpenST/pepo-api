const rootPrefix = '..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag');

class ParseBio {
  /**
   * @constructor
   *
   * @param {object} params
   * @param {string} params.bio - bio
   */
  constructor(params) {
    console.log('DATE =======', Date.now());
    const oThis = this;

    oThis.bio = params.bio.toLowerCase();

    oThis.tags = [];
    oThis.tagToWeightMap = {};
    oThis.insertMap = {};
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._parseText();

    if (CommonValidator.validateNonEmptyObject(oThis.insertMap)) {
      await oThis._insertTags();
    }

    console.log('DATE =======', Date.now());
  }

  /**
   *
   * @returns {Promise<void>}
   * @private
   */
  async _parseText() {
    const oThis = this,
      regexExp = /(^|\B)#[a-z0-9]\w+/gi; // Update this regex.
    // /(\B(#[a-z0-9])\w+)/gi;

    let caseStatement = '';

    oThis.tags = oThis.bio.match(regexExp).map(function(v) {
      return v
        .trim()
        .substring(1)
        .toLowerCase();
    });

    if (oThis.tags.length === 0) {
      return;
    }

    await oThis._getTags();

    for (let index = 0; index < oThis.tags.length; index++) {
      const tag = oThis.tags[index];

      if (oThis.tagToWeightMap[tag]) {
        oThis.tagToWeightMap[tag] = oThis.tagToWeightMap[tag] + 1;

        caseStatement = oThis._updateCaseStatement(caseStatement, tag, oThis.tagToWeightMap[tag]);
      } else {
        oThis.insertMap[tag] = oThis.insertMap[tag] + 1 || 1;
      }
    }

    caseStatement = '`weight` = case ' + caseStatement + ' end';

    await new TagModel().updateTags(caseStatement, oThis.tags);
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
   * Update tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTags() {
    const oThis = this;

    const dbRows = await new TagModel().getTags(oThis.tags);

    console.log('dbRows ======', dbRows);

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];

      oThis.tagToWeightMap[dbRow.name] = +dbRow.weight;
    }
    console.log('oThis.tagToWeightMap ======', oThis.tagToWeightMap);
  }

  /**
   * Update the case statement.
   *
   * @param caseStatement
   * @param tag
   * @param weight
   *
   * @returns {string}
   * @private
   */
  _updateCaseStatement(caseStatement, tag, weight) {
    const b = caseStatement + 'when name = ' + '"' + tag + '"' + ' then ' + weight + ' ';
    console.log('b ==========', b);

    return b;
  }
}

module.exports = ParseBio;
